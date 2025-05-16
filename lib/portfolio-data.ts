// This file contains all the portfolio data that will be displayed in the chat interface

export interface Experience {
  id: string
  company: string
  position: string
  duration: string
  description: string
}

export interface Publication {
  id: string
  title: string
  authors: string[]
  journal: string
  year: number
  link?: string
}

export interface Project {
  id: string
  title: string
  description: string
  link?: string
  image?: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  year: string
}

export interface Contact {
  email: string
  linkedin?: string
  github?: string
}

export interface PortfolioData {
  name: string
  title: string
  summary: string
  experiences: Experience[]
  publications: Publication[]
  projects: Project[]
  education: Education[]
  contact: Contact
}

// Sample portfolio data
export const portfolioData: PortfolioData = {
  name: "David Redó Nieto",
  title: "PhD Candidate",
  summary:
    "PhD student working on Artificial Intelligence and Computer Vision. ",
  experiences: [
    {
      id: "exp1",
      company: "Robotnik",
      position: "Robotic Engineer",
      duration: "2017 - 2020",
      description:
        "Software developer where I designed and implemented control systems for industrial robotics, enhancing automation capabilities for manufacturing clients.",
    },
    {
      id: "exp2",
      company: "Nokia Bell Labs (Spain)",
      position: "Summer Internship",
      duration: "2021",
      description:
        "Completed a summer internship at Nokia Bell Labs developing face recognition algorithms for 360° video conferencing cameras, improving remote participant identification and tracking.",
    },
    {
      id: "exp3",
      company: "Vicomtech",
      position: "Researcher",
      duration: "2022 - Present",
      description:
        "Currently pursuing my PhD at Vicomtech Research Center, where I conduct advanced research in computer vision and AI applications for industrial solutions.",
    },
  ],
  publications: [
    {
      id: "pub1",
      title: "MSP2P: Multi-Scale Point-based Approach for Optimal Crowd Localization Through Perspective Analysis",
      authors: ["David Redó", "Mikel Aramburu", "Jorge Garcia-Castaño", "Antonio José Sánchez Salmerón"],
      journal: "Journal of Image and Graphics",
      year: 2024,
      link: "https://www.joig.net/show-98-433-1.html",
    },
    {
      id: "pub2",
      title: "Securing multimedia-based personal data: towards a methodology for automated anonymization risk assessment seeking GDPR compliance.",
      authors: ["Mikel Aramburu", "David Redó", "Jorge Garcia Castaño"],
      journal: "Artificial Intelligence for Security and Defence Applications II",
      year: 2024,
      link: "https://doi.org/10.1117/12.3031687",
    },
  ],
  projects: [
    {
      id: "proj1",
      title: "Modelzilla",
      description:
        "This library turns any model class into a CLI executable. It is a lightweight Python package that enables developers to transform any AI model into a fully functional Command-Line Interface (CLI) plugin.",
      link: "https://github.com/David-rn/modelzilla",
    },
    {
      id: "proj2",
      title: "Supervision",
      description:
        "Contributed few times in an open-source library for reusable computer vision tools from Roboflow.",
      link: "https://github.com/David-rn/supervision",
    },
  ],
  education: [
    {
      id: "edu1",
      institution: "Universitat Poliècnica de València",
      degree: "Computer Science",
      year: "2014-2018",
    },
    {
      id: "edu2",
      institution: "Université de Bordeaux",
      degree: "MSc Image Processing and Computer Vision",
      year: "2020-2022",
    },
    {
      id: "edu3",
      institution: "Universitat Poliècnica de València",
      degree: "PhD Student",
      year: "2024-Present",
    },
  ],
  contact: {
    email: "dredonieto@gmail.com",
    linkedin: "https://www.linkedin.com/in/david-redó-nieto-5a6016138/",
    github: "https://github.com/David-rn",
  },
}

// Helper function to check if a query is related to a specific topic
export function isQueryRelatedTo(query: string, topic: string): boolean {
  const normalizedQuery = query.toLowerCase()
  const normalizedTopic = topic.toLowerCase()

  // Check if the query contains the topic
  if (normalizedQuery.includes(normalizedTopic)) {
    return true
  }

  // Topic-specific keywords
  const topicKeywords: Record<string, string[]> = {
    experience: ["work", "job", "career", "position", "employment", "company", "worked", "professional"],
    education: ["school", "university", "college", "degree", "study", "studied", "academic", "graduated", "studies", "master", "phd", "educational"],
    publications: ["paper", "article", "journal", "research", "publish", "published", "author", "wrote", "written"],
    projects: [
      "project",
      "portfolio",
      "built",
      "created",
      "developed",
      "made",
      "application",
      "app",
      "website",
    ],
    contact: ["contact", "email", "reach", "message", "connect", "linkedin", "github", "social", "website", "twitter"],
    about: ["about", "bio", "who", "person", "introduction", "summary", "yourself", "tell me about"],
  }

  // Check if the query contains any keywords related to the topic
  if (topicKeywords[normalizedTopic]) {
    return topicKeywords[normalizedTopic].some((keyword) => normalizedQuery.includes(keyword))
  }

  return false
}

// Function to determine if a query is within the scope of the portfolio
export function isQueryInScope(query: string): boolean {
  const topics = ["experience", "education", "publications", "projects", "contact", "about"]
  return topics.some((topic) => isQueryRelatedTo(query, topic))
}

// Function to get a response based on the query
export function getPortfolioResponse(query: string): string {
  const normalizedQuery = query.toLowerCase()

  // Check for general about queries
  if (isQueryRelatedTo(query, "about")) {
    return `Hi! I'm ${portfolioData.name}. ${portfolioData.summary} I love doing sports, a marathon from time to time. `
  }

  // Check for experience queries
  if (isQueryRelatedTo(query, "experience")) {
    let experienceText = "## Professional Experience\n"

    portfolioData.experiences.forEach((exp, index) => {
      experienceText += `### ${exp.position} at ${exp.company} (${exp.duration})\n`
      experienceText += `${exp.description}\n`

      // Add divider if not the last item
      if (index < portfolioData.experiences.length - 1) {
        experienceText += "---\n"
      }
    })

    return experienceText
  }

  // Check for education queries
  if (isQueryRelatedTo(query, "education")) {
    let educationText = "## Education\n"

    portfolioData.education.forEach((edu, index) => {
      educationText += `### ${edu.degree}\n`
      educationText += `${edu.institution} (${edu.year})\n`

      // Add divider if not the last item
      if (index < portfolioData.education.length - 1) {
        educationText += "---\n"
      }
    })

    return educationText
  }

  // Check for publications queries
  if (isQueryRelatedTo(query, "publications")) {
    let publicationsText = "## Publications\n"

    portfolioData.publications.forEach((pub, index) => {
      publicationsText += `### "${pub.title}" (${pub.year})\n`
      publicationsText += `**Authors:** ${pub.authors.join(", ")}\n`
      publicationsText += `**Published in:** ${pub.journal}\n`

      if (pub.link) {
        publicationsText += `\n**Link:** [${pub.link}](${pub.link})\n`
      }

      // Add divider if not the last item
      if (index < portfolioData.publications.length - 1) {
        publicationsText += "---\n"
      }
    })

    return publicationsText
  }

  // Check for projects queries
  if (isQueryRelatedTo(query, "projects")) {
    let projectsText = "## Projects\n"

    portfolioData.projects.forEach((proj, index) => {
      projectsText += `### ${proj.title}\n`
      projectsText += `${proj.description}\n`

      if (proj.link) {
        projectsText += `\n**Link:** [${proj.link}](${proj.link})\n`
      }

      // Add divider if not the last item
      if (index < portfolioData.projects.length - 1) {
        projectsText += "---\n"
      }
    })

    return projectsText
  }

  // Check for contact queries
  if (isQueryRelatedTo(query, "contact")) {
    const contact = portfolioData.contact
    let contactText = "## Contact Information\n"

    if (contact.email) contactText += `**Email:** ${contact.email}\n`
    if (contact.linkedin) contactText += `**LinkedIn:** [${contact.linkedin}](${contact.linkedin})\n`
    if (contact.github) contactText += `**GitHub:** [${contact.github}](${contact.github})\n`

    return contactText
  }

  // If we get here, the query is technically in scope but not specifically matched
  return `I'm not sure what specific information you're looking for about my portfolio. You can ask me about my experience, education, publications, projects, or contact information.`
}

// Function to get the out of scope response
export function getOutOfScopeResponse(): string {
  return "I'm sorry, but I can only provide information about my professional portfolio, including my experience, education, publications, projects, and contact information. If you have questions about any of these topics, I'd be happy to help!"
}
