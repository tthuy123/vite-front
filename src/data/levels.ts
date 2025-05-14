import type { Level, Chapter } from '../types';
import wlaslData from '../WLASL100_train.json';

const allSignData = wlaslData;

const allGlosses = allSignData.map(item => item.gloss);

export const levels: Level[] = [
  {
    level: 1,
    title: "Level 1",
    unlocked: true,
    chapters: createChaptersFromGlosses(allGlosses)
  }
];

function createChaptersFromGlosses(glosses: string[]): Chapter[] {
  const numChapters = Math.min(5, Math.ceil(glosses.length / 5));
  const glossesPerChapter = Math.ceil(glosses.length / numChapters);
  
  const chapters: Chapter[] = [];
  
  for (let i = 0; i < numChapters; i++) {
    const startIdx = i * glossesPerChapter;
    const endIdx = Math.min((i + 1) * glossesPerChapter, glosses.length);
    
    if (startIdx >= glosses.length) break;
    
    const chapterGlosses = glosses.slice(startIdx, endIdx);
    const chapterLessons = chapterGlosses.map((gloss, index) => {
      const signData = allSignData.find(item => item.gloss === gloss);
      
      if (!signData) {
        console.warn(`Sign data not found for gloss: ${gloss}`);
      }
      
      const videoSrc = signData && signData.instances.length > 0 
        ? signData.instances[0].url 
        : "";
      
      return {
        title: gloss.charAt(0).toUpperCase() + gloss.slice(1), 
        completed: false,
        locked: index !== 0, 
        id: `level-1-chapter-${i+1}-lesson-${index+1}-${gloss}`,
        videoSrc: videoSrc,
        duration: 30,
        signData: signData, 
      };
    });
    
    chapters.push({
      id: `chapter-${i+1}`,
      title: `Chapter ${i+1}`,
      description: `${chapterLessons.length} sign language lessons`,
      lessons: chapterLessons.length,
      completed: 0,
      lessonGroups: [],
      lessonList: chapterLessons,
    });
  }
  
  return chapters;
}


export const completeLesson = (levelIndex: number, chapterIndex: number, lessonIndex: number): boolean => {
  if (levelIndex < 0 || levelIndex >= levels.length) return false;
  if (!levels[levelIndex].unlocked) return false;

  const level = levels[levelIndex];
  if (chapterIndex < 0 || chapterIndex >= level.chapters.length) return false;

  const chapter = level.chapters[chapterIndex];
  if (lessonIndex < 0 || lessonIndex >= chapter.lessonList.length) return false;

  const lesson = chapter.lessonList[lessonIndex];
  if (lesson.locked || lesson.completed) return false;

  lesson.completed = true;
  chapter.completed += 1;

  if (lessonIndex + 1 < chapter.lessonList.length) {
    chapter.lessonList[lessonIndex + 1].locked = false;
  } 
  else if (chapterIndex + 1 < level.chapters.length) {
    const nextChapter = level.chapters[chapterIndex + 1];
    if (nextChapter.lessonList.length > 0) {
      nextChapter.lessonList[0].locked = false;
    }
  }
  else if (levelIndex + 1 < levels.length) {
    const nextLevel = levels[levelIndex + 1];
    nextLevel.unlocked = true;
  }

  return true;
};

export const getLessonById = (lessonId: string) => {
  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    const level = levels[levelIndex];
    for (let chapterIndex = 0; chapterIndex < level.chapters.length; chapterIndex++) {
      const chapter = level.chapters[chapterIndex];
      for (let lessonIndex = 0; lessonIndex < chapter.lessonList.length; lessonIndex++) {
        const lesson = chapter.lessonList[lessonIndex];
        if (lesson.id === lessonId) {
          return { lesson, levelIndex, chapterIndex, lessonIndex };
        }
      }
    }
  }
  return null;
};

export const getUnlockedLessons = (levelIndex: number, chapterIndex: number) => {
  if (levelIndex < 0 || levelIndex >= levels.length) return [];
  
  const level = levels[levelIndex];
  if (!level.unlocked || chapterIndex < 0 || chapterIndex >= level.chapters.length) return [];
  
  const chapter = level.chapters[chapterIndex];
  return chapter.lessonList
    .filter(lesson => !lesson.locked)
    .map(lesson => ({
      id: lesson.id || "",
      title: lesson.title,
      videoUrl: lesson.videoSrc || "",
      duration: lesson.duration || 30,
      signData: lesson.signData, 
    }));
};