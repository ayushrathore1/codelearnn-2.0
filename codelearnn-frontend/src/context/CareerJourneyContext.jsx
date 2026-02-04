import { useState, useEffect, createContext, useContext } from "react";
import { journeyAPI } from "../services/api";
import { useAuth } from "./AuthContext";

// Create context for journey state
const CareerJourneyContext = createContext(null);

export const useCareerJourney = () => {
  const context = useContext(CareerJourneyContext);
  if (!context) {
    throw new Error(
      "useCareerJourney must be used within CareerJourneyProvider",
    );
  }
  return context;
};

// Local storage key for offline fallback
const JOURNEY_STORAGE_KEY = "codelearnn_career_journey";

export const CareerJourneyProvider = ({ children }) => {
  const [journey, setJourney] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get auth context - if not authenticated, we'll work offline only
  let isAuthenticated = false;
  try {
    const auth = useAuth();
    isAuthenticated = auth?.isAuthenticated || false;
  } catch (_) {
    // AuthContext not available, work offline
    isAuthenticated = false;
  }

  // Load journey from backend (or localStorage fallback)
  useEffect(() => {
    const loadJourney = async () => {
      setIsLoading(true);
      try {
        // Try backend first if authenticated
        if (isAuthenticated) {
          try {
            const response = await journeyAPI.getActive();
            if (response.data?.success && response.data?.data) {
              const backendJourney = response.data.data;
              // Convert to frontend format
              setJourney({
                ...backendJourney,
                isActive: backendJourney.status === "active",
                currentPhase: {
                  phaseId: backendJourney.roadmap?.currentPhaseId,
                  phaseNumber: backendJourney.roadmap?.currentPhaseNumber,
                  progress:
                    backendJourney.roadmap?.phases?.find(
                      (p) =>
                        p.phaseId === backendJourney.roadmap?.currentPhaseId,
                    )?.progress || 0,
                },
              });
              // Also sync to localStorage for offline access
              localStorage.setItem(
                JOURNEY_STORAGE_KEY,
                JSON.stringify(backendJourney),
              );
              return;
            }
          } catch (apiError) {
            // API error (404 means no journey exists - this is expected behavior)
            // Only log actual errors, not expected 404s
            if (apiError.response?.status !== 404) {
              console.error("Backend journey fetch failed:", apiError);
            }
            // 404 is silently handled - user simply has no journey yet
          }
        }

        // Fallback to localStorage
        const stored = localStorage.getItem(JOURNEY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setJourney(parsed);
        }
      } catch (err) {
        console.error("Error loading journey:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadJourney();
  }, [isAuthenticated]);

  // Save journey to localStorage whenever it changes (for offline access)
  useEffect(() => {
    if (journey) {
      localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(journey));
    }
  }, [journey]);

  // Start a new career journey
  const startJourney = async (careerData, preferences) => {
    try {
      // Try backend first if authenticated
      if (isAuthenticated) {
        const response = await journeyAPI.start(careerData, preferences);
        if (response.data?.success && response.data?.data) {
          const backendJourney = response.data.data;
          setJourney({
            ...backendJourney,
            isActive: backendJourney.status === "active",
            currentPhase: {
              phaseId: backendJourney.roadmap?.currentPhaseId,
              phaseNumber: backendJourney.roadmap?.currentPhaseNumber,
              progress: 0,
            },
          });
          return backendJourney;
        }
      }

      // Fallback to local-only journey
      const newJourney = createLocalJourney(careerData, preferences);
      setJourney(newJourney);
      return newJourney;
    } catch (err) {
      console.error("Error starting journey:", err);
      // Fallback to local journey on error
      const newJourney = createLocalJourney(careerData, preferences);
      setJourney(newJourney);
      return newJourney;
    }
  };

  // Helper to create local journey
  const createLocalJourney = (careerData, preferences) => ({
    id: Date.now().toString(),
    isActive: true,
    startedAt: new Date().toISOString(),
    career: {
      careerId:
        careerData.careerId ||
        careerData.name?.toLowerCase().replace(/\s+/g, "-"),
      title: careerData.name || careerData.title,
      description: careerData.description,
      icon: careerData.icon,
      demandLevel: careerData.demandLevel,
      avgSalary: careerData.avgSalaryUSD,
      growthRate: careerData.growthRate,
    },
    preferences: {
      weeklyHours: preferences.weeklyHours || 10,
      experienceLevel: preferences.experienceLevel || "beginner",
      learningStyle: preferences.learningStyle || "mixed",
    },
    roadmap: {
      phases: generateDefaultPhases(careerData),
      estimatedWeeks: calculateEstimatedWeeks(preferences.weeklyHours),
      generatedAt: new Date().toISOString(),
      currentPhaseId: "phase-1",
      currentPhaseNumber: 1,
    },
    currentPhase: {
      phaseId: "phase-1",
      phaseNumber: 1,
      progress: 0,
    },
    stats: {
      overallProgress: 0,
      phasesCompleted: 0,
      resourcesCompleted: 0,
      projectsCompleted: 0,
      skillsAcquired: 0,
      totalLearningMinutes: 0,
      currentStreak: 0,
      onTrackStatus: "on_track",
      lastActivityDate: new Date().toISOString(),
    },
    history: [
      {
        eventType: "JOURNEY_STARTED",
        eventData: { career: careerData.name },
        timestamp: new Date().toISOString(),
      },
    ],
  });

  // Update journey progress
  const updateProgress = (phaseId, resourceId, _progressData) => {
    if (!journey) return;

    setJourney((prev) => {
      const updated = { ...prev };

      // Update resource completion
      const phase = updated.roadmap.phases.find((p) => p.phaseId === phaseId);
      if (phase) {
        const resource = phase.resources.find(
          (r) => r.resourceId === resourceId,
        );
        if (resource && !resource.isCompleted) {
          resource.isCompleted = true;
          resource.completedAt = new Date().toISOString();

          // Update phase progress
          const completedCount = phase.resources.filter(
            (r) => r.isCompleted,
          ).length;
          const totalCount = phase.resources.length;
          phase.progress = Math.round((completedCount / totalCount) * 100);

          // Update current phase
          if (updated.currentPhase.phaseId === phaseId) {
            updated.currentPhase.progress = phase.progress;
          }

          // Update stats
          updated.stats.resourcesCompleted++;
          updated.stats.lastActivityDate = new Date().toISOString();

          // Calculate overall progress
          const allPhases = updated.roadmap.phases;
          const totalProgress = allPhases.reduce(
            (sum, p) => sum + (p.progress || 0),
            0,
          );
          updated.stats.overallProgress = Math.round(
            totalProgress / allPhases.length,
          );

          // Check if phase is complete
          if (phase.progress >= 100 && phase.status !== "completed") {
            phase.status = "completed";
            phase.completedAt = new Date().toISOString();
            updated.stats.phasesCompleted++;

            // Unlock next phase
            const currentIdx = allPhases.findIndex(
              (p) => p.phaseId === phaseId,
            );
            if (currentIdx < allPhases.length - 1) {
              const nextPhase = allPhases[currentIdx + 1];
              nextPhase.status = "in_progress";
              nextPhase.startedAt = new Date().toISOString();
              updated.currentPhase = {
                phaseId: nextPhase.phaseId,
                phaseNumber: nextPhase.phaseNumber,
                progress: 0,
              };
            }
          }

          // Add to history
          updated.history.push({
            eventType: "RESOURCE_COMPLETED",
            eventData: { resourceId, phaseId },
            timestamp: new Date().toISOString(),
          });
        }
      }

      return updated;
    });
  };

  // Complete a project
  const completeProject = (phaseId, projectId) => {
    if (!journey) return;

    setJourney((prev) => {
      const updated = { ...prev };
      const phase = updated.roadmap.phases.find((p) => p.phaseId === phaseId);

      if (phase) {
        const project = phase.projects?.find((p) => p.projectId === projectId);
        if (project && !project.isCompleted) {
          project.isCompleted = true;
          project.completedAt = new Date().toISOString();
          updated.stats.projectsCompleted++;

          // Projects give bonus progress
          phase.progress = Math.min(100, (phase.progress || 0) + 15);

          updated.history.push({
            eventType: "PROJECT_COMPLETED",
            eventData: { projectId, phaseId },
            timestamp: new Date().toISOString(),
          });
        }
      }

      return updated;
    });
  };

  // Get next recommended actions
  const getNextActions = () => {
    if (!journey || !journey.roadmap?.phases) return [];

    const currentPhase = journey.roadmap.phases.find(
      (p) => p.phaseId === journey.currentPhase?.phaseId,
    );

    if (!currentPhase) return [];

    const actions = [];

    // Find incomplete resources
    const incompleteResources = (currentPhase.resources || [])
      .filter((r) => !r.isCompleted)
      .slice(0, 2);

    incompleteResources.forEach((resource) => {
      actions.push({
        type: "resource",
        title: resource.title,
        description: `Continue with ${resource.type}`,
        resourceId: resource.resourceId,
        phaseId: currentPhase.phaseId,
        priority: "high",
      });
    });

    // Check for pending projects
    const pendingProjects = (currentPhase.projects || []).filter(
      (p) => !p.isStarted && currentPhase.progress >= 50,
    );

    if (pendingProjects.length > 0) {
      actions.push({
        type: "project",
        title: pendingProjects[0].title,
        description: "Ready to start project",
        projectId: pendingProjects[0].projectId,
        phaseId: currentPhase.phaseId,
        priority: "medium",
      });
    }

    return actions;
  };

  // Reset journey
  const resetJourney = () => {
    localStorage.removeItem(JOURNEY_STORAGE_KEY);
    setJourney(null);
  };

  // Check if user has an active journey
  const hasActiveJourney = () => {
    return journey?.isActive === true;
  };

  const value = {
    journey,
    isLoading,
    error,
    startJourney,
    updateProgress,
    completeProject,
    getNextActions,
    resetJourney,
    hasActiveJourney,
  };

  return (
    <CareerJourneyContext.Provider value={value}>
      {children}
    </CareerJourneyContext.Provider>
  );
};

// Helper function to generate default phases based on career
function generateDefaultPhases(career) {
  const careerName = career.name || career.title || "Developer";

  // Define skill-based phases
  const phases = [
    {
      phaseId: "phase-1",
      phaseNumber: 1,
      title: "Fundamentals & Setup",
      description: `Build the foundational knowledge required for ${careerName}`,
      status: "in_progress",
      progress: 0,
      priority: "critical",
      startedAt: new Date().toISOString(),
      skills: [
        { skillName: "Programming Basics", targetScore: 80, currentScore: 0 },
        { skillName: "Version Control", targetScore: 70, currentScore: 0 },
        { skillName: "Problem Solving", targetScore: 75, currentScore: 0 },
      ],
      resources: [
        {
          resourceId: "r1-1",
          type: "video",
          title: "Introduction to Programming",
          duration: 120,
          isCompleted: false,
        },
        {
          resourceId: "r1-2",
          type: "video",
          title: "Git & GitHub Essentials",
          duration: 90,
          isCompleted: false,
        },
        {
          resourceId: "r1-3",
          type: "article",
          title: "Development Environment Setup",
          duration: 30,
          isCompleted: false,
        },
        {
          resourceId: "r1-4",
          type: "quiz",
          title: "Fundamentals Assessment",
          duration: 20,
          isCompleted: false,
        },
      ],
      projects: [
        {
          projectId: "p1-1",
          title: "Setup Development Portfolio",
          isStarted: false,
          isCompleted: false,
        },
      ],
      milestones: [
        {
          milestoneId: "m1-1",
          title: "Complete fundamentals quiz with 80%+",
          isAchieved: false,
        },
      ],
      durationWeeks: 3,
    },
    {
      phaseId: "phase-2",
      phaseNumber: 2,
      title: "Core Technical Skills",
      description: `Master the essential technical skills for ${careerName}`,
      status: "locked",
      progress: 0,
      priority: "critical",
      skills: [
        { skillName: "Core Technology", targetScore: 85, currentScore: 0 },
        { skillName: "Data Structures", targetScore: 70, currentScore: 0 },
        { skillName: "Algorithms", targetScore: 65, currentScore: 0 },
      ],
      resources: [
        {
          resourceId: "r2-1",
          type: "course",
          title: "Core Technology Deep Dive",
          duration: 300,
          isCompleted: false,
        },
        {
          resourceId: "r2-2",
          type: "video",
          title: "Data Structures Explained",
          duration: 180,
          isCompleted: false,
        },
        {
          resourceId: "r2-3",
          type: "practice",
          title: "Coding Challenges Set 1",
          duration: 120,
          isCompleted: false,
        },
        {
          resourceId: "r2-4",
          type: "quiz",
          title: "Technical Skills Assessment",
          duration: 30,
          isCompleted: false,
        },
      ],
      projects: [
        {
          projectId: "p2-1",
          title: "Build Your First Application",
          isStarted: false,
          isCompleted: false,
        },
      ],
      milestones: [
        {
          milestoneId: "m2-1",
          title: "Complete first functional project",
          isAchieved: false,
        },
      ],
      durationWeeks: 4,
    },
    {
      phaseId: "phase-3",
      phaseNumber: 3,
      title: "Intermediate Concepts",
      description: "Level up with intermediate concepts and practices",
      status: "locked",
      progress: 0,
      priority: "high",
      skills: [
        { skillName: "Frameworks", targetScore: 80, currentScore: 0 },
        { skillName: "Database Design", targetScore: 75, currentScore: 0 },
        { skillName: "API Development", targetScore: 80, currentScore: 0 },
      ],
      resources: [
        {
          resourceId: "r3-1",
          type: "course",
          title: "Popular Frameworks",
          duration: 360,
          isCompleted: false,
        },
        {
          resourceId: "r3-2",
          type: "video",
          title: "Database Fundamentals",
          duration: 150,
          isCompleted: false,
        },
        {
          resourceId: "r3-3",
          type: "tutorial",
          title: "Building REST APIs",
          duration: 180,
          isCompleted: false,
        },
      ],
      projects: [
        {
          projectId: "p3-1",
          title: "Full-Featured Application",
          isStarted: false,
          isCompleted: false,
        },
      ],
      durationWeeks: 5,
    },
    {
      phaseId: "phase-4",
      phaseNumber: 4,
      title: "Advanced & Professional Skills",
      description: "Master advanced concepts and professional practices",
      status: "locked",
      progress: 0,
      priority: "high",
      skills: [
        { skillName: "System Design", targetScore: 70, currentScore: 0 },
        { skillName: "Testing", targetScore: 75, currentScore: 0 },
        { skillName: "Security", targetScore: 70, currentScore: 0 },
      ],
      resources: [
        {
          resourceId: "r4-1",
          type: "course",
          title: "System Design Principles",
          duration: 240,
          isCompleted: false,
        },
        {
          resourceId: "r4-2",
          type: "video",
          title: "Testing Best Practices",
          duration: 120,
          isCompleted: false,
        },
        {
          resourceId: "r4-3",
          type: "article",
          title: "Security Essentials",
          duration: 60,
          isCompleted: false,
        },
      ],
      projects: [
        {
          projectId: "p4-1",
          title: "Production-Ready Project",
          isStarted: false,
          isCompleted: false,
        },
      ],
      durationWeeks: 5,
    },
    {
      phaseId: "phase-5",
      phaseNumber: 5,
      title: "Capstone & Career Prep",
      description: "Complete capstone project and prepare for job applications",
      status: "locked",
      progress: 0,
      priority: "medium",
      skills: [
        { skillName: "Portfolio Building", targetScore: 85, currentScore: 0 },
        { skillName: "Interview Prep", targetScore: 80, currentScore: 0 },
      ],
      resources: [
        {
          resourceId: "r5-1",
          type: "guide",
          title: "Portfolio Building Guide",
          duration: 60,
          isCompleted: false,
        },
        {
          resourceId: "r5-2",
          type: "course",
          title: "Interview Preparation",
          duration: 180,
          isCompleted: false,
        },
        {
          resourceId: "r5-3",
          type: "practice",
          title: "Mock Interviews",
          duration: 120,
          isCompleted: false,
        },
      ],
      projects: [
        {
          projectId: "p5-1",
          title: "Capstone Project",
          isStarted: false,
          isCompleted: false,
        },
      ],
      milestones: [
        {
          milestoneId: "m5-1",
          title: "Portfolio complete with 3+ projects",
          isAchieved: false,
        },
        { milestoneId: "m5-2", title: "Career ready!", isAchieved: false },
      ],
      durationWeeks: 4,
    },
  ];

  return phases;
}

// Calculate estimated weeks based on weekly hours
function calculateEstimatedWeeks(weeklyHours) {
  const baseWeeks = 21; // Total weeks for all phases
  const baseHours = 15; // Reference hours per week

  // Adjust timeline based on user's commitment
  const adjustment = baseHours / weeklyHours;
  return Math.round(baseWeeks * adjustment);
}

export default CareerJourneyProvider;
