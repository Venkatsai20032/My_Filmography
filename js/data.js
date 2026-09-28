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
    "Drama", "Action", "Romance", "Period", "Mystery", "Crime"
  ],
  types: [
    "Web series", "Short films", "Short-series", "Movies", "Reels", "Cover songs", "Feature Films"
  ],
  languages: [
    "Telugu", "English", "Hindi", "Tamil", "Malayalam", "Kannada", "Bengali", "Marathi"
  ],
  platforms: [
    "YouTube", "ETV Win", "Amazon Prime", "Netflix", "Aha", "Disney+ Hotstar", "Zee5", "SonyLIV", "JioCinema"
  ],
  statuses: [
    { label: "Active 🟢", value: "Active", color: "#22c55e", bg: "rgba(34, 197, 94, 0.18)" },
    { label: "Currently Unavailable 🔴", value: "Currently Unavailable", color: "#ef4444", bg: "rgba(239, 68, 68, 0.18)" },
    { label: "Weekdays 🟡", value: "Weekdays", color: "#eab308", bg: "rgba(234, 179, 8, 0.18)" },
    { label: "Weekends 🟣", value: "Weekends", color: "#a855f7", bg: "rgba(168, 85, 247, 0.18)" }
  ]
};

// Default template state - enriched with user's actual profile and web series data
export const DEFAULT_PORTFOLIO_DATA = {
  profile: {
    avatarUrl: "",
    avatarFit: "cover",
    avatarScale: 100,
    avatarOffset: 50,
    status: "Active",
    p1: "",
    p1Scale: 100,
    p2: "",
    p2Scale: 100,
    p3: "",
    p3Scale: 100,
    mobile: "+91 98765 43210",
    email: "thotavenkatsai@example.com",
    socials: {
      instagram: "https://instagram.com/",
      facebook: "https://facebook.com/",
      whatsapp: "https://wa.me/919876543210",
      youtube: "https://youtube.com/",
      x: "https://x.com/"
    },
    username: "thota_venkat_sai",
    name: "Thota Venkat Sai",
    gender: "Male",
    age: "23",
    dob: "2002-12-05",
    categories: ["Director", "Actor", "Screenwriter", "Editor", "Cinematographer", "Photographer"],
    state: "Andhra Pradesh",
    city: "Tirupati",
    place: "Tirupati",
    areaOfInterest: ["Direction", "Acting", "Writing"],
    interestedGenre: ["Rom-com", "Neo-Noir", "Thriller", "Drama"],
    interestedType: ["Web series", "Short films", "Short-series", "Movies"],
    experienceYears: "3 Years",
    languagesKnown: ["Telugu", "English", "Hindi"],
    availability: "Active"
  },
  summary: {
    bio: "Passionate filmmaker, director, and screenwriter crafting compelling visual stories and emotionally gripping narratives. Experienced in helming web series, indie productions, and creative cinema with an emphasis on authentic character dynamics and cinematic visual flow.",
    motive: "Seeking visionary producers, platforms, and creative cinema technicians for upcoming high-concept web series and feature film projects."
  },
  projectHeader: {
    noOfProjects: "01",
    typesOfProjects: ["Web series", "Short-series", "Short films"]
  },
  projects: [
    {
      id: "prj-01",
      number: "01",
      title: "Don't be shy",
      thumbnail: "",
      creditType: "text",
      creditName: "DIRECTED BY THOTA VENKAT SAI",
      creditImage: "",
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
          title: "Episode 1",
          role: "Director",
          type: "Web series",
          storyline: "A 5-episode rom-com about a B.Tech student working as a food delivery agent who unexpectedly meets an IT employee. Connected later through a dating app, they begin an unusual journey of love, care, fights, misunderstandings, twists, comedy and emotional moments.",
          link: "https://youtu.be/DxmRcukX29g?si=PG2Ax39-knPwrn1v",
          releaseYear: "2026",
          thumbnail: ""
        }
      ]
    }
  ]
};

if (typeof window !== "undefined") {
  window.PRESETS = PRESETS;
  window.DEFAULT_PORTFOLIO_DATA = DEFAULT_PORTFOLIO_DATA;
}
