export const LEADERSHIP_ROLES = [
  {
    id: "chairperson",
    title: "President",
    description:
      "Leads the community, chairs meetings, provides overall direction and represents Mulembe.",
  },
  {
    id: "vice-chairperson",
    title: "Vice President",
    description:
      "Supports the President and takes over their responsibilities when they are unavailable.",
  },
  {
    id: "secretary",
    title: "Secretary General",
    description:
      "Manages minutes, correspondence, meeting notices, records and general administration.",
  },
  {
    id: "treasurer",
    title: "Treasurer",
    description: "Manages finances, payments, financial records and reports.",
  },
  {
    id: "public-officer",
    title: "Public Officer",
    description:
      "Handles official/statutory matters and ensures required Association records and obligations are maintained.",
  },
  {
    id: "welfare-coordinator",
    title: "Welfare Coordinator",
    description:
      "Coordinates welfare activities, member support and the Welfare Team.",
  },
  {
    id: "social-media-coordinator",
    title: "Social Media Team — One Female and One Male",
    description:
      "Two representatives manage social media, community announcements, promotions and online engagement.",
  },
  {
    id: "events-coordinator",
    title: "Events Coordinator",
    description:
      "Coordinates community events and leads event planning and organising teams.",
  },
  {
    id: "advisory-representative",
    title: "Advisory Team — One Female and One Male",
    description:
      "Two representatives provide advice, guidance and support to the Committee.",
  },
] as const;

export type LeadershipRoleId = (typeof LEADERSHIP_ROLES)[number]["id"];

export const CONSTITUTION_VERSION = "2026";
