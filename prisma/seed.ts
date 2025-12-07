import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seed...");

  // Create sample courses
  const webDevCourse = await prisma.course.upsert({
    where: { slug: "web-development-fundamentals" },
    update: {},
    create: {
      title: "Web Development Fundamentals",
      slug: "web-development-fundamentals",
      description:
        "Learn the fundamentals of web development including HTML, CSS, and JavaScript. Build responsive websites and understand how the web works.",
      level: "BEGINNER",
      duration: 20,
      careerPaths: ["Software Developer", "Frontend Developer", "Web Designer"],
      skills: ["HTML", "CSS", "JavaScript", "Responsive Design"],
      isPublished: true,
      publishedAt: new Date(),
      topics: {
        create: [
          {
            title: "Introduction to HTML",
            description: "Learn the basics of HTML structure and semantic markup",
            order: 1,
            duration: 30,
            videoUrl: "https://example.com/videos/html-intro",
            textContent:
              "HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page and consists of a series of elements that tell the browser how to display content.",
            quiz: {
              create: {
                title: "HTML Basics Quiz",
                passingScore: 70,
                questions: {
                  create: [
                    {
                      question: "What does HTML stand for?",
                      options: [
                        "Hyper Text Markup Language",
                        "Home Tool Markup Language",
                        "Hyperlinks and Text Markup Language",
                        "Hyperlinking Text Marking Language",
                      ],
                      correctAnswer: 0,
                      order: 1,
                    },
                    {
                      question: "Which tag is used to define the largest heading?",
                      options: ["<h6>", "<heading>", "<h1>", "<head>"],
                      correctAnswer: 2,
                      order: 2,
                    },
                    {
                      question: "What is the correct HTML element for inserting a line break?",
                      options: ["<break>", "<lb>", "<br>", "<newline>"],
                      correctAnswer: 2,
                      order: 3,
                    },
                  ],
                },
              },
            },
          },
          {
            title: "CSS Styling Basics",
            description: "Learn how to style web pages with CSS",
            order: 2,
            duration: 45,
            videoUrl: "https://example.com/videos/css-basics",
            textContent:
              "CSS (Cascading Style Sheets) is used to style and layout web pages. It allows you to control colors, fonts, spacing, and the overall visual presentation of your HTML content.",
            quiz: {
              create: {
                title: "CSS Basics Quiz",
                passingScore: 70,
                questions: {
                  create: [
                    {
                      question: "What does CSS stand for?",
                      options: [
                        "Computer Style Sheets",
                        "Creative Style Sheets",
                        "Cascading Style Sheets",
                        "Colorful Style Sheets",
                      ],
                      correctAnswer: 2,
                      order: 1,
                    },
                    {
                      question: "Which property is used to change the background color?",
                      options: ["color", "bgcolor", "background-color", "background"],
                      correctAnswer: 2,
                      order: 2,
                    },
                  ],
                },
              },
            },
          },
          {
            title: "JavaScript Fundamentals",
            description: "Introduction to JavaScript programming",
            order: 3,
            duration: 60,
            videoUrl: "https://example.com/videos/js-fundamentals",
            textContent:
              "JavaScript is a programming language that allows you to implement complex features on web pages. It enables interactive elements, dynamic content, and real-time updates.",
            quiz: {
              create: {
                title: "JavaScript Quiz",
                passingScore: 70,
                questions: {
                  create: [
                    {
                      question: "Inside which HTML element do we put JavaScript?",
                      options: ["<javascript>", "<js>", "<scripting>", "<script>"],
                      correctAnswer: 3,
                      order: 1,
                    },
                    {
                      question: "How do you write 'Hello World' in an alert box?",
                      options: [
                        "alertBox('Hello World')",
                        "msg('Hello World')",
                        "alert('Hello World')",
                        "msgBox('Hello World')",
                      ],
                      correctAnswer: 2,
                      order: 2,
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  });

  const dataAnalysisCourse = await prisma.course.upsert({
    where: { slug: "data-analysis-essentials" },
    update: {},
    create: {
      title: "Data Analysis Essentials",
      slug: "data-analysis-essentials",
      description:
        "Master the fundamentals of data analysis. Learn to work with spreadsheets, understand statistics, and create meaningful visualizations.",
      level: "BEGINNER",
      duration: 15,
      careerPaths: ["Data Analyst", "Business Analyst", "Research Analyst"],
      skills: ["Excel", "Statistics", "Data Visualization", "Critical Thinking"],
      isPublished: true,
      publishedAt: new Date(),
      topics: {
        create: [
          {
            title: "Introduction to Data Analysis",
            description: "Understanding the data analysis process and its importance",
            order: 1,
            duration: 25,
            textContent:
              "Data analysis is the process of inspecting, cleaning, transforming, and modeling data to discover useful information, draw conclusions, and support decision-making.",
            quiz: {
              create: {
                title: "Data Analysis Intro Quiz",
                passingScore: 70,
                questions: {
                  create: [
                    {
                      question: "What is the primary goal of data analysis?",
                      options: [
                        "To collect more data",
                        "To extract useful insights from data",
                        "To delete unnecessary data",
                        "To create charts only",
                      ],
                      correctAnswer: 1,
                      order: 1,
                    },
                  ],
                },
              },
            },
          },
          {
            title: "Working with Spreadsheets",
            description: "Learn essential spreadsheet skills for data analysis",
            order: 2,
            duration: 40,
            textContent:
              "Spreadsheets are powerful tools for organizing, analyzing, and visualizing data. Learn essential functions, formulas, and techniques for effective data management.",
            quiz: {
              create: {
                title: "Spreadsheets Quiz",
                passingScore: 70,
                questions: {
                  create: [
                    {
                      question: "Which function is used to calculate the average of a range?",
                      options: ["SUM", "AVERAGE", "COUNT", "MEAN"],
                      correctAnswer: 1,
                      order: 1,
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  });

  const digitalMarketingCourse = await prisma.course.upsert({
    where: { slug: "digital-marketing-basics" },
    update: {},
    create: {
      title: "Digital Marketing Basics",
      slug: "digital-marketing-basics",
      description:
        "Learn the fundamentals of digital marketing including social media, SEO, content marketing, and analytics.",
      level: "BEGINNER",
      duration: 12,
      careerPaths: ["Digital Marketer", "Social Media Manager", "Content Creator"],
      skills: ["Social Media", "SEO", "Content Marketing", "Analytics"],
      isPublished: true,
      publishedAt: new Date(),
      topics: {
        create: [
          {
            title: "Digital Marketing Overview",
            description: "Understanding the digital marketing landscape",
            order: 1,
            duration: 20,
            textContent:
              "Digital marketing encompasses all marketing efforts that use electronic devices or the internet. It includes channels like search engines, social media, email, and websites.",
            quiz: {
              create: {
                title: "Digital Marketing Intro Quiz",
                passingScore: 70,
                questions: {
                  create: [
                    {
                      question: "What is SEO?",
                      options: [
                        "Social Engine Optimization",
                        "Search Engine Optimization",
                        "Site Enhancement Option",
                        "Search Enhancement Operation",
                      ],
                      correctAnswer: 1,
                      order: 1,
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  });

  // Create a sample company and job
  const techCompany = await prisma.company.upsert({
    where: { slug: "innovate-tech-sl" },
    update: {},
    create: {
      name: "Innovate Tech SL",
      slug: "innovate-tech-sl",
      description:
        "A leading technology company in Sierra Leone focused on digital transformation and innovation.",
      website: "https://innovatetech.sl",
      industry: "Technology",
      location: "Freetown, Sierra Leone",
      isPartner: true,
    },
  });

  // Create jobs separately due to Prisma limitations with nested creates in upsert
  await prisma.job.upsert({
    where: { slug: "junior-web-developer" },
    update: {},
    create: {
      companyId: techCompany.id,
      title: "Junior Web Developer",
      slug: "junior-web-developer",
      description:
        "We are looking for a passionate junior web developer to join our growing team. You will work on exciting projects that impact thousands of users.",
      requirements:
        "Basic understanding of HTML, CSS, and JavaScript. Eagerness to learn and grow. Good communication skills.",
      location: "Freetown",
      jobType: "Full-time",
      salaryRange: "SLL 3,000,000 - 5,000,000/month",
      requiredSkills: ["HTML", "CSS", "JavaScript"],
      requiredCourses: ["web-development-fundamentals"],
      isDirectPlacement: true,
      isActive: true,
    },
  });

  await prisma.job.upsert({
    where: { slug: "data-entry-specialist" },
    update: {},
    create: {
      companyId: techCompany.id,
      title: "Data Entry Specialist",
      slug: "data-entry-specialist",
      description: "Seeking detail-oriented individual for data entry and analysis tasks.",
      requirements: "Proficiency in spreadsheets. Attention to detail. Fast typing speed.",
      location: "Freetown",
      jobType: "Full-time",
      salaryRange: "SLL 2,000,000 - 3,500,000/month",
      requiredSkills: ["Excel", "Data Entry", "Attention to Detail"],
      requiredCourses: ["data-analysis-essentials"],
      isActive: true,
    },
  });

  const marketingAgency = await prisma.company.upsert({
    where: { slug: "bright-media-sl" },
    update: {},
    create: {
      name: "Bright Media SL",
      slug: "bright-media-sl",
      description:
        "Creative digital marketing agency helping businesses grow their online presence.",
      website: "https://brightmedia.sl",
      industry: "Marketing",
      location: "Freetown, Sierra Leone",
      isPartner: true,
    },
  });

  await prisma.job.upsert({
    where: { slug: "social-media-coordinator" },
    update: {},
    create: {
      companyId: marketingAgency.id,
      title: "Social Media Coordinator",
      slug: "social-media-coordinator",
      description: "Manage social media accounts and create engaging content for our clients.",
      requirements:
        "Understanding of social media platforms. Creative mindset. Good writing skills.",
      location: "Freetown",
      jobType: "Full-time",
      salaryRange: "SLL 2,500,000 - 4,000,000/month",
      requiredSkills: ["Social Media", "Content Creation", "Communication"],
      requiredCourses: ["digital-marketing-basics"],
      isActive: true,
    },
  });

  // Create default admin user if credentials are provided
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Admin",
          passwordHash,
          role: "ADMIN",
          emailVerified: new Date(),
        },
      });
      console.log(`✅ Created default admin user: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
    }
  } else {
    console.log(
      "ℹ️  Skipping admin creation (DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD not set)"
    );
  }

  console.log("✅ Seed completed!");
  console.log(
    `Created courses: ${webDevCourse.title}, ${dataAnalysisCourse.title}, ${digitalMarketingCourse.title}`
  );
  console.log(`Created companies: ${techCompany.name}, ${marketingAgency.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
