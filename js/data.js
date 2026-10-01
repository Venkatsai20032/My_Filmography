// Filmography Presets and Default Initial Data

export const PRESETS = {
  states: [
    "Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Kerala",
    "Maharashtra", "Delhi", "West Bengal", "Gujarat", "Rajasthan",
    "Uttar Pradesh", "Bihar", "Odisha", "Punjab", "Haryana",
    "Assam", "Goa", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
    "Madhya Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Sikkim", "Tripura", "Uttarakhand", "Andaman and Nicobar Islands",
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep", "Puducherry", "Ladakh"
  ],
  cities: [
    "Tirupati", "Hyderabad", "Visakhapatnam", "Vijayawada", "Guntur", "Warangal", "Kurnool", "Rajahmundry", "Nellore", "Kakinada",
    "Mumbai", "Pune", "Bengaluru", "Chennai", "Kochi", "Thiruvananthapuram", "Kozhikode", "Coimbatore", "Madurai", "Mysuru",
    "Delhi", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Bhopal", "Indore", "Patna", "Bhubaneswar", "Guwahati"
  ],
  categories: [
    "Director", "Actor", "Screenwriter", "Editor", "Cinematographer",
    "Photographer", "Producer", "Sound Designer", "Music Director", "Art Director", "VFX Artist", "Lyricist"
  ],
  interests: [
    "Direction", "Acting", "Writing", "Cinematography", "Editing", 
    "Sound Design", "Producing", "Color Grading", "Music Direction", "VFX"
  ],
  genres: [
    "Rom-com", "Neo-Noir", "Thriller", "Horror", "Comedy", "Mythology", "Sci-Fi", 
    "Drama", "Action", "Romance", "Period", "Mystery", "Crime", "Patriotic", "Action Drama", "Intense Drama", "Suspense Intense Drama"
  ],
  types: [
    "Web series", "Short films", "Short-series", "Movies", "Reels", "Cover songs", "Lyrical Video", "Feature Films"
  ],
  languages: [
    "Telugu", "English", "Hindi", "Tamil", "Malayalam", "Kannada", "Bengali", "Marathi"
  ],
  platforms: [
    "YouTube", "ETV Win", "Amazon Prime", "Netflix", "Aha", "Disney+ Hotstar", "Zee5", "SonyLIV", "JioCinema", "Instagram"
  ],
  statuses: [
    { label: "Active 🟢", value: "Active", color: "#22c55e", bg: "rgba(34, 197, 94, 0.18)" },
    { label: "Currently Unavailable 🔴", value: "Currently Unavailable", color: "#ef4444", bg: "rgba(239, 68, 68, 0.18)" },
    { label: "Weekdays 🟡", value: "Weekdays", color: "#eab308", bg: "rgba(234, 179, 8, 0.18)" },
    { label: "Weekends 🟣", value: "Weekends", color: "#a855f7", bg: "rgba(168, 85, 247, 0.18)" }
  ]
};

// Default template state - enriched with user's complete actual profile and all 10 projects
export const DEFAULT_PORTFOLIO_DATA = {
  profile: {
    avatarUrl: "./images/avatar.jpg",
    avatarFit: "cover",
    avatarScale: 97,
    avatarOffset: 100,
    status: "Active",
    p1: "./images/p1.jpg",
    p1Scale: 100,
    p2: "./images/p2.jpg",
    p2Scale: 100,
    p3: "./images/p3.jpg",
    p3Scale: 100,
    mobile: "+918712179478",
    email: "thotavenkatsai269@gmail.com",
    socials: {
      instagram: "https://www.instagram.com/mr_venkat_100?stkn=cXlscWdoZzhnOTQ0",
      facebook: "https://facebook.com/",
      whatsapp: "https://wa.me/918712179478",
      youtube: "https://youtube.com/@venkatyashcreations9362?si=UL-vhu675UaK7_jk",
      x: "https://x.com/ThotaYash"
    },
    username: "thota_venkat_sai",
    name: "THOTA VENKAT SAI",
    gender: "Male",
    age: "23",
    dob: "2002-12-05",
    categories: ["Director", "Actor", "Screenwriter", "Editor", "Cinematographer", "Photographer"],
    state: "Andhra Pradesh",
    city: "Tirupati",
    place: "Tirupati",
    areaOfInterest: ["Direction", "Acting", "Writing"],
    interestedGenre: ["Rom-com", "Neo-Noir", "Thriller", "Drama", "Horror", "Comedy", "Mythology", "Sci-Fi", "Action", "Period", "Crime", "Mystery"],
    interestedType: ["Web series", "Short films", "Short-series", "Movies"],
    experienceYears: "4 Years",
    languagesKnown: ["Telugu", "English", "Hindi"],
    availability: "Active"
  },
  summary: {
    bio: "Passionate storyteller and filmmaker focused on impactful visual narratives, engaging characters, and emotionally driven storytelling. Experienced in creating short films and web series, with a strong interest in exploring diverse genres through zero-budget and cost-effective filmmaking. Also a film & content reviewer, promoting and supporting projects across different genres without bias or expectations through @mana_shortfilm_page. Alongside filmmaking, I work as a Content Creator, Photographer, and Videographer, managing @vycreations.ig — a multimedia creative platform focused on photography, video production, editing, scripts, and creative works.",
    motive: "Seeking visionary producers, platforms, and creative cinema technicians for upcoming high-concept film projects. & Open to collaborations, building creative teams, and working together like a family to bring meaningful stories to life."
  },
  projectHeader: {
    noOfProjects: "10",
    typesOfProjects: ["Web series", "Short-series", "Short films", "Lyrical Video"]
  },
  projects: [
    {
      id: "prj-01",
      number: "01",
      title: "Don't be shy",
      thumbnail: "./images/project-01.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-01-credit.jpg",
      genre: "Rom-com",
      role: "Director",
      type: "Web series",
      storyline: "A 5-episode rom-com about a B.Tech student working as a food delivery agent who unexpectedly meets an IT employee. Connected later through a dating app, they begin an unusual journey of love, care, fights, misunderstandings, twists, comedy and emotional moments.",
      availableOn: "YouTube",
      link: "https://youtu.be/DxmRcukX29g?si=PG2Ax39-knPwrn1v",
      releaseYear: "2026",
      episodes: [
        {
          id: "ep-01-1",
          episodeNo: "01",
          title: "Episode 1 - The Introduction",
          role: "Director",
          type: "Web series",
          storyline: "A 5-episode rom-com about a B.Tech student working as a food delivery agent who unexpectedly meets an IT employee. Connected later through a dating app, they begin an unusual journey of love, care, fights, misunderstandings, twists, comedy and emotional moments.",
          link: "https://youtu.be/DxmRcukX29g?si=PG2Ax39-knPwrn1v",
          releaseYear: "2026",
          thumbnail: ""
        },
        {
          id: "ep-01-2",
          episodeNo: "02",
          title: "Episode 2 - The Flat Sharing",
          role: "Director",
          type: "Web series",
          storyline: "The story progresses as the bond grows with hilarious and heartwarming flat-sharing moments.",
          link: "https://youtu.be/6Lxo2ZKDP3s?si=t1vGOQ8rt4-O0yzc",
          releaseYear: "2026",
          thumbnail: ""
        },
        {
          id: "ep-01-3",
          episodeNo: "03",
          title: "Episode 3 - The Journey of Love",
          role: "Director",
          type: "Web series",
          storyline: "Navigating misunderstandings, unexpected care, and the deep emotional connection forming between them.",
          link: "https://youtu.be/xYpfSohybxQ?si=rTs5PmmsaSRXTSry",
          releaseYear: "2026",
          thumbnail: ""
        },
        {
          id: "ep-01-4",
          episodeNo: "04",
          title: "Episode 4 - The Romantic Move",
          role: "Director",
          type: "Web series",
          storyline: "Romantic turns, comedic situations, and pivotal moments leading up to the series climax.",
          link: "https://youtu.be/F-atekQasEA?si=EEgHbNM0wnVrun6f",
          releaseYear: "2026",
          thumbnail: ""
        },
        {
          id: "ep-01-5",
          episodeNo: "05",
          title: "Episode 5 – The Forbearance",
          role: "Director",
          type: "Web series",
          storyline: "The emotional and heartwarming series finale bringing the journey to its memorable conclusion.",
          link: "https://youtu.be/ypmuxbHagv8?si=NvVlM3A9r0Pb9jQp",
          releaseYear: "2026",
          thumbnail: ""
        }
      ]
    },
    {
      id: "prj-02",
      number: "02",
      title: "Don't Be Shy Lyrical Video",
      thumbnail: "./images/project-02.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-02-credit.jpg",
      genre: "Rom-com",
      role: "Director - Editor - DOP",
      type: "Cover songs",
      storyline: "A lyrical video based on the web series, portraying the emotions of love, care, affection, and anger between a girl and a boy. After realizing the girl's emotions and anger, the boy expresses their beautiful journey through a melody, hoping to ease her anger and bring her back to a happier mood.",
      availableOn: "YouTube",
      link: "https://www.instagram.com/reel/DcR1zn6BkaN/?stkn=MmRscDFqdDRsMnV2",
      releaseYear: "2026",
      episodes: []
    },
    {
      id: "prj-03",
      number: "03",
      title: "Street Fighters Phase 2 : The Fight",
      thumbnail: "./images/project-03.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-03-credit.jpg",
      genre: "Action Drama",
      role: "Director - Writer - Actor - Editor - Cinematographer",
      type: "Short films",
      storyline: "The continuation of Street Fighters – Phase 1: The Introduction. The story explores what happens after the events of the first phase: who stops the riots, how they are brought under control, and whether the city can finally return to safety.",
      availableOn: "YouTube",
      link: "https://youtu.be/oENN11tZGMM",
      releaseYear: "2025",
      episodes: []
    },
    {
      id: "prj-04",
      number: "04",
      title: "Street Fighters Phase 1 : The Introduction",
      thumbnail: "./images/project-04.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-04-credit.jpg",
      genre: "Action Drama",
      role: "Director - Writer - Actor - Editor - Cinematographer",
      type: "Short films",
      storyline: "An action-emotional drama set in Tirupati. The story explores how friendship can influence and transform a hometown during a period of riots and conflict. This phase introduces the characters, their relationships, and the circumstances that lead to the larger conflict.",
      availableOn: "YouTube",
      link: "https://youtu.be/GTh9NPcEQoU",
      releaseYear: "2026",
      episodes: []
    },
    {
      id: "prj-05",
      number: "05",
      title: "The Independence Day",
      thumbnail: "./images/project-05.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-05-credit.jpg",
      genre: "Patriotic",
      role: "Writer",
      type: "Short films",
      storyline: "A patriotic, message-oriented concept that focuses on the simple and meaningful things people can do to celebrate Independence Day. Rather than relying on elaborate words or speeches, the concept communicates its message through real-life actions and situations.",
      availableOn: "YouTube",
      link: "https://youtu.be/3TQQ0vUzkbI?si=ywGMxgxReX1OI28L",
      releaseYear: "2024",
      episodes: []
    },
    {
      id: "prj-06",
      number: "06",
      title: "Values of Independence",
      thumbnail: "./images/project-06.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-06-credit.jpg",
      genre: "Patriotic",
      role: "Director-Writer-Editor-Actor-DOP",
      type: "Short films",
      storyline: "A message-oriented concept that explores the importance and value of independence. The story communicates its ideas primarily through actions and situations rather than dialogue, allowing the audience to understand the message visually.",
      availableOn: "YouTube",
      link: "https://youtu.be/FO-4g5HiWwg",
      releaseYear: "2023",
      episodes: []
    },
    {
      id: "prj-07",
      number: "07",
      title: "Crazy Hostelers -2 (The Basket Ball )",
      thumbnail: "./images/project-07.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-07-credit.jpg",
      genre: "Intense Drama",
      role: "Director- Writer - Actor - Editor",
      type: "Short films",
      storyline: "A continuation of Crazy Hosteler – Episode 1: The Introduction*. The story explores how a group of Telugu students come together after facing different forms of humiliation and discrimination from local Tamil students. Their experiences eventually lead to a basketball challenge, turning the conflict into an intense competition. However, the rivalry ultimately ends in friendship as the students put aside differences based on city, state, and language. The story delivers the message that friendship comes first, while language, region, and state come next.",
      availableOn: "YouTube",
      link: "https://youtu.be/laDynZQybf4",
      releaseYear: "2023",
      episodes: []
    },
    {
      id: "prj-08",
      number: "08",
      title: "Fear",
      thumbnail: "./images/project-08.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-08-credit.jpg",
      genre: "Intense Drama",
      role: "Director - Writer - Actor - Editor - DOP",
      type: "Short films",
      storyline: "An action-driven motivational drama about a weak and fearful person who learns to overcome his limitations through the support of a strong and motivating friend. When a bully repeatedly harasses him, the protagonist is unable to fight back despite having the physical ability to do so because of his deep fear. His friend, instead of directly fighting the bully, reminds him of the pain from his broken love story and transforms that emotional weakness into motivation. The protagonist finally finds the courage to confront the bully. The central message is that everyone has weaknesses, but when you turn one of those weaknesses into strength, nothing can stop you.",
      availableOn: "YouTube",
      link: "https://youtu.be/mtAB2p33uG4",
      releaseYear: "2026",
      episodes: []
    },
    {
      id: "prj-09",
      number: "09",
      title: "Find ?",
      thumbnail: "./images/project-09.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-09-credit.jpg",
      genre: "Suspense Intense Drama",
      role: "Director - Writer - Actor - Editor",
      type: "Short films",
      storyline: "A hostel-based mystery drama set among a group of students. When Venkat's purse is stolen by one of the hostelers, he begins trying to uncover who committed the theft. The story progresses through a series of smooth twists, tense moments, and intense drama as Venkat investigates the people around him and attempts to identify the real culprit.",
      availableOn: "YouTube",
      link: "https://youtu.be/3L94Rzo8IMY",
      releaseYear: "2022",
      episodes: []
    },
    {
      id: "prj-10",
      number: "10",
      title: "Crazy Hostelers ( Episode 1 : The Introduction)",
      thumbnail: "./images/project-10.jpg",
      creditType: "image",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "./images/project-10-credit.jpg",
      genre: "Comedy - Intense Drama",
      role: "Director - Writer - Actor - Editor",
      type: "Short films",
      storyline: "A student from Andhra Pradesh joins a reputed college in Tamil Nadu and faces the challenges of adapting to a new environment, particularly the language and cultural barriers. The story follows his struggle to survive and adjust to college life while dealing with unfamiliar surroundings and communication difficulties. The film combines tension, humor, and drama to portray his experiences.",
      availableOn: "YouTube",
      link: "https://youtu.be/OSNb11uVRg4",
      releaseYear: "2022",
      episodes: []
    }
  ]
};

if (typeof window !== "undefined") {
  window.PRESETS = PRESETS;
  window.DEFAULT_PORTFOLIO_DATA = DEFAULT_PORTFOLIO_DATA;
}
