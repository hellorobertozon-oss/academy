import type { CopyKey } from "@/components/academy-provider";

export type LearningModule = {
  id: string;
  title: CopyKey;
  description: CopyKey;
  number: CopyKey;
  image: string;
  lessons: CopyKey[];
};

export const learningModules: LearningModule[] = [
  {
    id: "helmet-care",
    title: "helmetCareTitle",
    description: "helmetCareDescription",
    number: "moduleOne",
    image: "/assets/module-thumbnail.png",
    lessons: [
      "helmetTextLesson",
      "helmetLessonOne",
      "helmetLessonTwo",
      "helmetLessonThree",
      "helmetLessonFour",
      "helmetLessonFive",
      "helmetLessonSix",
    ],
  },
  {
    id: "leather-care",
    title: "leatherCareTitle",
    description: "leatherCareDescription",
    number: "moduleTwo",
    image: "/assets/module-thumbnail-2.png",
    lessons: ["leatherLessonOne", "leatherLessonTwo", "leatherLessonThree", "leatherLessonFour", "leatherLessonFive"],
  },
  {
    id: "textile-care",
    title: "textileCareTitle",
    description: "textileCareDescription",
    number: "moduleThree",
    image: "/assets/module-thumbnail-3.png",
    lessons: [
      "textileLessonOne",
      "textileLessonTwo",
      "textileLessonThree",
      "textileLessonFour",
      "textileLessonFive",
      "textileLessonSix",
    ],
  },
  {
    id: "gloves-accessories",
    title: "glovesCareTitle",
    description: "glovesCareDescription",
    number: "moduleFour",
    image: "/assets/module-care.svg",
    lessons: ["glovesLessonOne", "glovesLessonTwo", "glovesLessonThree"],
  },
  {
    id: "motorcycle-detailing",
    title: "motorcycleDetailingTitle",
    description: "motorcycleDetailingDescription",
    number: "moduleFive",
    image: "/assets/xzone-motorcycle-ceramic-detailer.webp",
    lessons: [
      "detailingLessonOne",
      "detailingLessonTwo",
      "detailingLessonThree",
      "detailingLessonFour",
      "detailingLessonFive",
      "detailingLessonSix",
    ],
  },
  {
    id: "off-road-care",
    title: "offRoadTitle",
    description: "offRoadDescription",
    number: "moduleSix",
    image: "/assets/module-thumb.png",
    lessons: ["offRoadLessonOne", "offRoadLessonTwo", "offRoadLessonThree", "offRoadLessonFour"],
  },
  {
    id: "sales-skills",
    title: "salesSkillsTitle",
    description: "salesSkillsDescription",
    number: "moduleSeven",
    image: "/assets/module-advice.svg",
    lessons: ["salesLessonOne", "salesLessonTwo", "salesLessonThree", "salesLessonFour", "salesLessonFive"],
  },
];

export const lessonTakeaways: CopyKey[] = [
  "lessonTakeawayOne",
  "lessonTakeawayTwo",
  "lessonTakeawayThree",
  "lessonTakeawayFour",
  "lessonTakeawayFive",
];
