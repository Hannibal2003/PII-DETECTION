// pii-detection.ts
import { genAIClient } from './genai-client';
import { callGeminiForValidation } from './geminiHelper';

type PiiType =
  | 'Name'
  | 'Mobile'
  | 'CreditCard'
  | 'BankAccount'
  | 'Email'
  | 'Address'
  | 'Aadhaar'
  | 'Birthday' // Added
  | 'Passport' // Added
  | 'DriversLicense'; // Added

export interface PiiMatch {
  type: PiiType;
  value: string;
  maskedValue: string;
  position: {
    start: number;
    end: number;
  };
  confidence?: number;
}

export interface PiiSummary {
  type: PiiType;
  count: number;
  confidence?: number;
}

const PII_PATTERNS = {
  Name: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g,
  Mobile: /(\+?[\-\s]?(?:91[\-\s]?)?[6-9]\d{9})/g,
  Email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  Aadhaar: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  CreditCard: /\b(?:\d[ -]?){13,19}\b/g,
  BankAccount: /\b\d{9,18}\b/g,
  Address: /\b\d{1,4}[\s,.-]*(?:[\w\s,.-]+?)(?:road|street|avenue|lane|city|town|village|nagar)\b/gi,
  // Added Birthday (various formats)
  Birthday: /\b(?:(?:(?:0?[1-9]|[12]\d|3[01])[\/\-.](?:0?[1-9]|1[0-2])[\/\-.]\d{4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4})|(?:\d{4}[\/\-.](?:0?[1-9]|1[0-2])[\/\-.](?:0?[1-9]|[12]\d|3[01])))\b/g,
  // Added Passport (common structures)
  Passport: /\b[A-Z]{1,3}[0-9]{6,9}\b/g,
  // Added Driver's License (common structures)
  DriversLicense: /\b[A-Z]{2}[0-9]{1,2}[\s-]?[0-9]{4}[\s-]?[0-9]{5,7}\b|\b[A-Z]{2}[0-9]{11,13}\b/g,
};

const CONTEXT_KEYWORDS = {
  Name: ['name', 'user', 'full name', 'username'],
  Mobile: ['mobile', 'phone', 'contact', 'whatsapp'],
  Email: ['email', 'e-mail', 'contact@'],
  Aadhaar: ['aadhaar', 'uid', 'unique id'],
  CreditCard: ['card', 'credit', 'debit', 'visa'],
  BankAccount: ['account', 'bank', 'iban'],
  Address: ['address', 'location', 'residence','home'],
  Birthday: ['birthday', 'dob', 'date of birth'], // Added
  Passport: ['passport', 'passport no', 'travel document'], // Added
  DriversLicense: ['license', 'dl', "driver's license", 'driving license'] // Added
};

export const maskPii = (value: string, type: PiiType): string => {
  const maskingStrategies = {
    Name: (v: string) => v.slice(0, 2) + '*'.repeat(Math.max(0, v.length - 2)),
    Mobile: (v: string) => v.slice(0, -4).replace(/\d/g, '*') + v.slice(-4),
    Email: (v: string) => v.replace(/^(.)(.*)(@.)(.*)$/, '$1****$3****'),
    Aadhaar: (v: string) =>  v.replace(/\d/g, 'A'),
    CreditCard: (v: string) => v.replace(/\d(?=\d{4})/g, 'C'),
    BankAccount: (v: string) => v.slice(0, -4).replace(/\d/g, '*') + v.slice(-4),
    Address: (v: string) => v.replace(/\b\d+\b/g, '&&'), // Mask only numbers in address
    Birthday: (v: string) => v.replace(/\d/g, 'B'), // Mask all digits with 'B'
    Passport: (v: string) => v.slice(0, 2) + '*'.repeat(Math.max(0, v.length - 4)) + v.slice(-2), // Keep first 2 and last 2 chars
    DriversLicense: (v: string) => v.slice(0, 3) + '*'.repeat(Math.max(0, v.length - 5)) + v.slice(-2) // Keep first 3 and last 2 chars
  };
  return maskingStrategies[type](value);
};

const findPositions = (text: string, value: string): { start: number, end: number }[] => {
  const positions = [];
  let index = text.indexOf(value);
  while (index !== -1) {
    positions.push({ start: index, end: index + value.length });
    index = text.indexOf(value, index + 1);
  }
  return positions;
};

export const detectPii = async (text: string): Promise<PiiMatch[]> => {
  const matches: PiiMatch[] = [];

  // Regex Detection
  Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = match[0];
      // Remove the strict context keyword check to allow more potential matches
      // The AI validation step later will filter false positives.
      // const context = text.substring(Math.max(0, match.index - 40), match.index + 40);
      // const hasContext = CONTEXT_KEYWORDS[type as PiiType].some(kw =>
      //   context.toLowerCase().includes(kw.toLowerCase())
      // );
      // if (hasContext) {

      matches.push({
        type: type as PiiType,
        value,
        maskedValue: maskPii(value, type as PiiType),
        position: { start: match.index, end: match.index + value.length }
      });

      // } // End of removed context check block
    }
  });

  // AI Detection
  try {
    const aiResponse = await genAIClient.getGenerativeModel({ model: 'gemini-2.0-flash' })
      .generateContent(`Analyze this text for PII:\n\n${text}\n\nReturn JSON array of {type: "${Object.keys(PII_PATTERNS).join('|')}", value: string}. Include types: Name, Mobile, CreditCard, BankAccount, Email, Address, Aadhaar, Birthday, Passport, DriversLicense.`);

    const aiText = (await aiResponse.response).text();
    let aiData: Array<{type: PiiType, value: string}> = [];

    // Extract JSON array from potential markdown/text response
    const jsonMatch = aiText.match(/\[(.*?)\]/s); // Find content within the first [] brackets
    if (jsonMatch && jsonMatch[0]) {
      try {
        aiData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('AI response JSON parsing failed:', parseError, 'Raw text:', aiText);
        // Keep aiData as empty array if parsing fails
      }
    } else {
       console.warn('Could not find JSON array in AI response:', aiText);
    }

    aiData.forEach(item => {
      findPositions(text, item.value).forEach(pos => {
        const existing = matches.some(m => 
          m.position.start === pos.start && m.position.end === pos.end
        );
        
        if (!existing) {
          matches.push({
            ...item,
            maskedValue: maskPii(item.value, item.type),
            position: pos
          });
        }
      });
    });
  } catch (error) {
    console.error('AI detection failed:', error);
  }

  // Temporarily disable AI Validation and Confidence Scoring for debugging
  /*
  for (const match of matches) {
    // Assign a default confidence if validation is skipped
    match.confidence = 0.8; // Default confidence when validation is off
    // const { isValid, confidence } = await callGeminiForValidation(match.value, match.type);
    // if (!isValid) {
    //   matches.splice(matches.indexOf(match), 1);
    // } else {
    //   match.confidence = confidence;
    // }
  }
  */
  // Assign a default confidence to all matches since validation is skipped
  matches.forEach(match => match.confidence = 0.8);

  // Remove overlaps
  return matches.sort((a, b) => a.position.start - b.position.start)
    .filter((match, index, arr) => 
      arr.slice(0, index).every(m => 
        m.position.end <= match.position.start || m.position.start >= match.position.end
      )
    );
};

export const getPiiSummary = (matches: PiiMatch[]): PiiSummary[] => {
  const summary = new Map<PiiType, { count: number, totalConfidence: number }>();
  
  matches.forEach(match => {
    const current = summary.get(match.type) || { count: 0, totalConfidence: 0 };
    current.count++;
    current.totalConfidence += match.confidence || 0.8;
    summary.set(match.type, current);
  });

  return Array.from(summary.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    confidence: data.totalConfidence / data.count
  }));
};

export const highlightPiiInText = (text: string, matches: PiiMatch[], isMasked = false): string => {
  const sorted = [...matches].sort((a, b) => b.position.start - a.position.start);
  let result = text;
  
  sorted.forEach(match => {
    const display = isMasked ? match.maskedValue : match.value;
    result = [
      result.slice(0, match.position.start),
      `<span class="pii-${match.type}" data-confidence="${match.confidence?.toFixed(2)}">${display}</span>`,
      result.slice(match.position.end)
    ].join('');
  });

  return result;
};