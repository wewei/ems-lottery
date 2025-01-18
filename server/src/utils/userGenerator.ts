import { faker } from '@faker-js/faker/locale/zh_CN';

export interface GeneratedUser {
  alias: string;
  nickname: string;
  password: string;
}

const generateRandomLowerLetters = (length: number): string => {
  return Array.from({ length }, () => 
    String.fromCharCode(97 + Math.floor(Math.random() * 26))
  ).join('');
};

export const generateTestUser = (): GeneratedUser => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    alias: `test-${generateRandomLowerLetters(6)}`,
    nickname: `${firstName} ${lastName}`,
    password: 'test123' // 默认密码
  };
};

export const generateTestUsers = (count: number): GeneratedUser[] => {
  return Array.from({ length: count }, () => generateTestUser());
}; 