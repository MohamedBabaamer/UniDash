import { GoogleGenerativeAI } from '@google/generative-ai';

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
};

export const generateChapterDescription = async (
  chapterTitle: string,
  courseName: string,
  professorName: string
): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('AI API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file. Get a free key from: https://makersuite.google.com/app/apikey');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an academic assistant helping to write course material descriptions.

Course: ${courseName}
Professor: ${professorName}
Chapter Title: ${chapterTitle}

Write a clear, concise, and academic description (2-3 sentences, max 150 words) for this chapter that explains what students will learn. Focus on key concepts and learning objectives. Write in French if the course is in French, otherwise in English.

Description:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No description generated');
    }

    return text.trim();
  } catch (error: any) {
    console.error('Error generating description:', error);
    throw new Error(error.message || 'Failed to generate description');
  }
};

export const generateSeriesDescription = async (
  seriesTitle: string,
  seriesType: 'TD' | 'TP' | 'Exam',
  courseName: string
): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('AI API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file. Get a free key from: https://makersuite.google.com/app/apikey');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const typeMap = {
    'TD': 'Travaux Dirigés (Tutorial/Exercise)',
    'TP': 'Travaux Pratiques (Practical Lab Work)',
    'Exam': 'Exam'
  };

  const prompt = `You are an academic assistant helping to write course material descriptions.

Course: ${courseName}
Type: ${typeMap[seriesType]}
Title: ${seriesTitle}

Write a brief, clear description (1-2 sentences, max 100 words) for this ${typeMap[seriesType]} that explains what it covers. Write in French if the course is in French, otherwise in English.

Description:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No description generated');
    }

    return text.trim();
  } catch (error: any) {
    console.error('Error generating description:', error);
    throw new Error(error.message || 'Failed to generate description');
  }
};
