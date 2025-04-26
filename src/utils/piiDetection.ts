type PiiType = 
  | 'Name'
  | 'Mobile'
  | 'CreditCard'
  | 'BankAccount'
  | 'Email'
  | 'Address'
  | 'Aadhaar';

export interface PiiMatch {
  type: PiiType;
  value: string;
  maskedValue: string;
  position: {
    start: number;
    end: number;
  };
}

export interface PiiSummary {
  type: PiiType;
  count: number;
}

const PII_PATTERNS = {
  Name: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b|(\b[A-Z]+\b(?:\s+[A-Z]+\b){1,2})/g,
  Mobile: /(\+?[\-\s]?(?:91[\-\s]?)?[6-9]{1}[0-9]{3}[\-\s]?[0-9]{6})|([6-9]{1}[0-9]{3}[\-\s]?[0-9]{6})/g,
  Email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  Aadhaar: /\b([2-9]{1}[0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4})\b/g,
  CreditCard: /\b(?:\d[ -]?){13,19}\b/g,
  BankAccount: /\b([0-9]{9,18})\b|([A-Za-z]{2}[0-9]{2}[A-Za-z0-9]{4,30})/g,
  Address: /\b\d+(?:\/\d+)?(?:,\s*|\s+)[A-Za-z0-9\s,.-]+(?:road|street|avenue|lane|nagar|colony|layout|Road|Street|Tamil\s*Nadu|Karnataka|Maharashtra|Delhi|Uttar\s*Pradesh|Gujarat|West\s*Bengal|Rajasthan)\b/gi,
};

// Common obfuscation patterns
const OBFUSCATION_PATTERNS = {
  mixedNumbersLetters: /([A-Za-z]+\d+[A-Za-z]+|\d+[A-Za-z]+\d+)/g,
  spacedOut: /([A-Za-z0-9]\s*){8,}/g,
  symbolReplacement: /([A-Za-z0-9]+(?:[_\-\.,]?[A-Za-z0-9]+){2,})/g,
  wordSeparators: /\b(\w+)\s*(?:\(?(?:at|dot)\)?|\[?(?:at|dot)\]?)\s*(\w+)\b/gi
};

export const maskPii = (value: string, type: PiiType): string => {
  switch (type) {
    case 'Name':
      return value.slice(0, 2) + '*'.repeat(Math.max(0, value.length - 2));
    case 'Mobile':
      return value.slice(0, -4).replace(/[0-9]/g, '*') + value.slice(-4);
    case 'Email':
      // Handle obfuscated emails like "name at domain dot com"
      if (value.includes(' at ') || value.includes(' dot ') || 
          value.includes('(at)') || value.includes('(dot)')) {
        return '****@****.***';
      }
      return value.replace(/^([^@]{1,2})[^@]*([^@]{0,2}@).*$/, '$1****$2****');
    case 'Address':
      return value
        .replace(/(\d{1,4})/g, '****')
        .replace(/([A-Za-z0-9\s]+)(?:road|street|avenue|lane|nagar|colony|layout)/gi, '$1****');
    case 'Aadhaar':
      return value.slice(0, -4).replace(/[0-9]/g, 'A') + value.slice(-4);
    case 'CreditCard':
      return value.slice(0, -4).replace(/[0-9]/g, 'C') + value.slice(-4);
    case 'BankAccount':
      return value.slice(0, -4).replace(/[0-9]/g, '*') + value.slice(-4);
    default:
      return value;
  }
};

export const detectPii = (text: string): PiiMatch[] => {
  let matches: PiiMatch[] = [];

  // Enhanced keyword lists with variations
  const nameKeywords = ['name', 'user name', 'full name', 'username', 'nickname', 'alias'];
  const mobileKeywords = ['phone', 'mobile', 'contact', 'number', 'tel', 'cell', 'whatsapp'];
  const bankKeywords = ['account', 'bank', 'iban', 'acct', 'account no', 'acc number'];
  const aadhaarKeywords = ['aadhaar', 'aadhar', 'uid', 'unique id', 'identity'];
  const emailKeywords = ['email', 'e-mail', 'mail', 'mail id', 'contact@', 'correspondence','Contact me at'];
  const creditCardKeywords = ['card', 'creditcard', 'debit','Credit Card', 'visa', 'mastercard', 'amex'];
  const addressKeywords = ['address', 'location', 'residence', 'home', 'office', 'street', 'road'];

  // Check for obfuscated patterns first
  const detectObfuscatedPii = (text: string): void => {
    // Check for obfuscated emails (name at domain dot com)
    const emailMatches = text.match(OBFUSCATION_PATTERNS.wordSeparators);
    if (emailMatches) {
      emailMatches.forEach(match => {
        const normalizedEmail = match
          .replace(/\s*(?:\(?(?:at|dot)\)?|\[?(?:at|dot)\]?)\s*/gi, (m) => 
            m.toLowerCase().includes('at') ? '@' : '.');
          
        if (normalizedEmail.includes('@') && normalizedEmail.includes('.')) {
          matches.push({
            type: 'Email',
            value: match,
            maskedValue: maskPii(normalizedEmail, 'Email'),
            position: {
              start: text.indexOf(match),
              end: text.indexOf(match) + match.length,
            },
          });
        }
      });
    }

    // Check for spaced out PII (like credit cards or Aadhaar)
    const spacedMatches = text.match(OBFUSCATION_PATTERNS.spacedOut);
    if (spacedMatches) {
      spacedMatches.forEach(match => {
        const normalized = match.replace(/\s+/g, '');
        // Check if it could be a credit card
        if (/^\d{13,19}$/.test(normalized)) {
          matches.push({
            type: 'CreditCard',
            value: match,
            maskedValue: maskPii(normalized, 'CreditCard'),
            position: {
              start: text.indexOf(match),
              end: text.indexOf(match) + match.length,
            },
          });
        }
        // Check if it could be Aadhaar
        else if (/^[2-9]\d{11}$/.test(normalized)) {
          matches.push({
            type: 'Aadhaar',
            value: match,
            maskedValue: maskPii(normalized, 'Aadhaar'),
            position: {
              start: text.indexOf(match),
              end: text.indexOf(match) + match.length,
            },
          });
        }
      });
    }
  };

  // First detect obfuscated PII
  detectObfuscatedPii(text);

  // Then detect standard PII patterns
  const isContextPresent = (startIndex: number, keywords: string[], windowSize = 50): boolean => {
    const startContext = Math.max(0, startIndex - windowSize);
    const endContext = Math.min(text.length, startIndex + windowSize);
    const contextText = text.substring(startContext, endContext).toLowerCase();
    
    // Check for keywords in the context
    const hasKeyword = keywords.some(keyword => contextText.includes(keyword));
    
    // Also check for common field patterns like "field: value" or "field = value"
    const fieldPattern = new RegExp(`(?:^|\\s)(${keywords.join('|')})\\s*[:=]\\s*`, 'i');
    
    return hasKeyword || fieldPattern.test(contextText);
  };

  Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Use the first non-null group if regex has alternations
      const value = match.slice(1).find(m => m) || match[0];
      
      // Skip if already detected as obfuscated
      if (matches.some(m => 
        m.position.start <= match.index && m.position.end >= match.index + value.length)) {
        continue;
      }

      // Skip if in the middle of a URL
      const isInUrl = /https?:\/\/[^\s]+/.test(text.slice(
        Math.max(0, match.index - 10), 
        Math.min(text.length, match.index + value.length + 10)
      ));
      if (isInUrl) continue;

      // Context checks
      let requiresContext = true;
      let contextKeywords: string[] = [];
      
      switch (type) {
        case 'Name':
          contextKeywords = nameKeywords;
          // Allow names at start of sentences without context
          if (match.index === 0 || /[.!?]\s+$/.test(text.substring(0, match.index))) {
            requiresContext = false;
          }
          break;
        case 'Mobile':
          contextKeywords = mobileKeywords;
          // Allow mobile numbers with country code without context
          if (value.includes('+91') || value.includes('+1') || value.includes('+')) {
            requiresContext = false;
          }
          break;
        case 'BankAccount':
          contextKeywords = bankKeywords;
          break;
        case 'Aadhaar':
          contextKeywords = aadhaarKeywords;
          // Aadhaar numbers have specific patterns that make them identifiable
          requiresContext = false;
          break;
        case 'Email':
          contextKeywords = emailKeywords;
          // Emails are usually self-identifying
          requiresContext = false;
          break;
        case 'CreditCard':
          contextKeywords = creditCardKeywords;
          // Credit cards have specific patterns (Luhn check could be added)
          requiresContext = false;
          break;
        case 'Address':
          contextKeywords = addressKeywords;
          break;
      }

      if (requiresContext && !isContextPresent(match.index, contextKeywords)) {
        continue;
      }

      matches.push({
        type: type as PiiType,
        value,
        maskedValue: maskPii(value, type as PiiType),
        position: {
          start: match.index,
          end: match.index + value.length,
        },
      });
    }
  });

  // Remove overlapping matches (prioritize more specific matches)
  matches = matches.filter((match, index) => {
    for (let i = 0; i < matches.length; i++) {
      if (i !== index && 
          matches[i].position.start <= match.position.start && 
          matches[i].position.end >= match.position.end) {
        return false;
      }
    }
    return true;
  });

  return matches;
};

// Rest of the functions remain the same
export const getPiiSummary = (matches: PiiMatch[]): PiiSummary[] => {
  const summary: Record<string, number> = {};
  matches.forEach(match => {
    if (summary[match.type]) {
      summary[match.type]++;
    } else {
      summary[match.type] = 1;
    }
  });
  return Object.entries(summary).map(([type, count]) => ({
    type: type as PiiType,
    count,
  }));
};

export const highlightPiiInText = (text: string, matches: PiiMatch[], isMasked: boolean = false): string => {
  const sortedMatches = [...matches].sort((a, b) => a.position.start - b.position.start);
  let highlightedText = text;
  let offset = 0;
  sortedMatches.forEach(match => {
    const { start, end } = match.position;
    const displayValue = isMasked ? match.maskedValue : match.value;
    const className = isMasked ? "pii-masked" : "pii-highlight";
    const startPos = start + offset;
    const endPos = end + offset;
    const highlightSpan = `<span class="${className}" data-pii-type="${match.type}">${displayValue}</span>`;
    highlightedText = 
      highlightedText.substring(0, startPos) + 
      highlightSpan + 
      highlightedText.substring(endPos);
    offset += highlightSpan.length - (end - start);
  });
  return highlightedText;
};