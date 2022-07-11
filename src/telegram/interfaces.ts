export interface User {
  telegramId: number;
  username: string;
  firstName: string;
  lastName: string;
  languageCode: string;
  isBot: boolean;
  isRestricted: boolean;
  isScam: boolean;
  isSupport: boolean;
  isSelf: boolean;
  isDeleted: boolean;
  isUpdated: boolean;
  isVerified: boolean;
  isAnonymous: boolean;
}
