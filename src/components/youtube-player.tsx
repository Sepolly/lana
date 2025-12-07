"use client";

import * as React from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  SkipBack, 
  SkipForward, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui";

// --- Types ---

interface YouTubePlayerProps {
  videoUrl: string;
  topicId: string;
  topicTitle: string;
  topicDescription?: string;
  courseSlug: string;
  enrollmentId?: string;
  initialProgress?: number;
  onProgressUpdate?: (progress: number) => void;
  onComplete?: () => void;
  disableProgressUpdate?: boolean; // If true, don't save progress updates (for completed topics)
}

interface TranscriptData {
  transcript: string;
  summary: string;
  keyPoints: string[];
  duration?: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (elementId: string, config: any) => any;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
  }
}

// --- Helper Functions ---

function extractVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?\s]+)/);
  return match ? match[1] : null;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// --- Component ---

export function YouTubePlayer({
  videoUrl,
  topicId,
  topicTitle,
  topicDescription,
  courseSlug,
  enrollmentId,
  initialProgress = 0,
  onProgressUpdate,
  onComplete,
  disableProgressUpdate = false,
}: YouTubePlayerProps) {
  const videoId = extractVideoId(videoUrl);
  const playerRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const progressInterval = React.useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgress = React.useRef<number>(initialProgress);
  const playerContainerId = `yt-player-${topicId.replace(/[^a-zA-Z0-9]/g, '')}`;
  
  // Client-side only flag to prevent hydration issues
  const [isMounted, setIsMounted] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isBuffering, setIsBuffering] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(100);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [progress, setProgress] = React.useState(initialProgress);
  const [hasCompleted, setHasCompleted] = React.useState(initialProgress >= 100);
  // Track if video was already completed when loaded (to prevent progress updates on rewatch)
  const wasCompletedInitially = React.useRef(initialProgress >= 100);
  const savedCompletedProgress = React.useRef(initialProgress >= 100 ? initialProgress : 0);
  
  // Transcript state
  const [transcript, setTranscript] = React.useState<TranscriptData | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = React.useState(false);
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [transcriptError, setTranscriptError] = React.useState<string | null>(null);
  
  // Video error state
  const [videoError, setVideoError] = React.useState<string | null>(null);

  // Reset all local state when the topic/video changes so progress from a
  // previous topic never "bleeds" into the next one.
  React.useEffect(() => {
    setIsReady(false);
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
    setDuration(0);
    setShowControls(true);

    // Reset progress/completion flags based on the new initialProgress
    setProgress(initialProgress);
    const completed = initialProgress >= 100;
    setHasCompleted(completed);
    wasCompletedInitially.current = completed;
    savedCompletedProgress.current = completed ? initialProgress : 0;
    lastSavedProgress.current = initialProgress;

    // Reset transcript-related state for the new topic
    setTranscript(null);
    setShowTranscript(false);
    setTranscriptError(null);
    setIsLoadingTranscript(false);
    
    // Reset video error state
    setVideoError(null);
  }, [topicId, videoUrl, initialProgress]);

  // Set mounted after hydration
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load YouTube API and initialize player
  React.useEffect(() => {
    if (!isMounted || !videoId) return;

    let player: any = null;

    const initPlayer = () => {
      const container = document.getElementById(playerContainerId);
      if (!container || playerRef.current) return;

      player = new window.YT.Player(playerContainerId, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          playsinline: 1,
          iv_load_policy: 3, // Hide annotations
        },
        events: {
          onReady: (event: any) => {
            console.log('[YouTubePlayer] Player ready');
            playerRef.current = event.target;
            setIsReady(true);
            setDuration(event.target.getDuration());
            setVolume(event.target.getVolume());
            
            // Seek to saved progress if any (only if not already completed)
            if (initialProgress > 0 && initialProgress < 100) {
              const seekTime = (initialProgress / 100) * event.target.getDuration();
              event.target.seekTo(seekTime, true);
            } else if (wasCompletedInitially.current && savedCompletedProgress.current > 0) {
              // If video was completed, seek to the saved completed progress
              const seekTime = (savedCompletedProgress.current / 100) * event.target.getDuration();
              event.target.seekTo(seekTime, true);
              setProgress(savedCompletedProgress.current);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
            } else if (state === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (state === window.YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              // Video ended - mark as complete with 100% progress
              if (playerRef.current) {
                try {
                  const dur = playerRef.current.getDuration();
                  const curr = playerRef.current.getCurrentTime();
                  const pct = dur > 0 ? (curr / dur) * 100 : 100;
                  handleVideoComplete(pct);
                } catch {
                  handleVideoComplete(100);
                }
              } else {
                handleVideoComplete(100);
              }
            }
          },
          onError: (event: any) => {
            const errorCode = event.data;
            console.error('[YouTubePlayer] Error:', errorCode);
            
            // YouTube error codes: https://developers.google.com/youtube/iframe_api_reference#Events
            let errorMessage = "Unable to play this video.";
            switch (errorCode) {
              case 2:
                errorMessage = "Invalid video URL or video not found.";
                break;
              case 5:
                errorMessage = "HTML5 player error. Please try refreshing the page.";
                break;
              case 100:
                errorMessage = "Video not found or has been removed.";
                break;
              case 101:
              case 150:
                errorMessage = "This video cannot be played in embedded players. The video owner may have disabled embedding.";
                break;
              default:
                errorMessage = `Video playback error (Code: ${errorCode}). The video may have restrictions or be unavailable.`;
            }
            
            setVideoError(errorMessage);
            setIsReady(false);
          },
        },
      });
    };

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Load the API
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      stopProgressTracking();
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [isMounted, videoId, playerContainerId, initialProgress]);

  // Progress tracking
  React.useEffect(() => {
    if (isPlaying) {
      startProgressTracking();
    } else {
      stopProgressTracking();
    }
    return () => stopProgressTracking();
  }, [isPlaying]);

  const startProgressTracking = () => {
    stopProgressTracking();
    progressInterval.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          setCurrentTime(curr);
          setDuration(dur);
          
          if (dur > 0) {
            const pct = (curr / dur) * 100;
            
            // If video was already completed, don't update saved progress - keep it at saved completed percentage
            if (wasCompletedInitially.current) {
              // Keep progress display at saved completed percentage, but allow video to play normally
              // Don't call onProgressUpdate or saveProgress to preserve the original completion percentage
              setProgress(savedCompletedProgress.current);
              return; // Don't save new progress or check completion
            }
            
            // Normal progress tracking for videos not yet completed
            setProgress(pct);
            if (!disableProgressUpdate) {
              onProgressUpdate?.(pct);
            }
            
            // Check for completion at 99.5% or higher (accounts for YouTube rounding)
            // Also check if video has ended (currentTime very close to duration)
            const isNearEnd = dur > 0 && (curr >= dur - 0.5); // Within 0.5 seconds of end
            if ((pct >= 99.5 || isNearEnd) && !hasCompleted && !disableProgressUpdate) {
              handleVideoComplete(100); // Always mark as 100% when near completion
            }
            
            // Save progress every 5% change (only if not already completed and updates enabled)
            if (!disableProgressUpdate && Math.abs(pct - lastSavedProgress.current) >= 5) {
              saveProgress(pct);
              lastSavedProgress.current = pct;
            }
          }
        } catch (e) {
          console.error('[YouTubePlayer] Progress tracking error:', e);
        }
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  // Player controls
  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const time = (pct / 100) * duration;
    playerRef.current.seekTo(time, true);
    setCurrentTime(time);
    
    // If video is completed, don't update progress display or save to backend
    // Keep the progress at the saved completion percentage
    if (hasCompleted || wasCompletedInitially.current || disableProgressUpdate) {
      // Don't update progress state - keep it at saved completion percentage
      return;
    }
    
    // Only update progress if video is not completed
    setProgress(pct);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;
    const vol = parseInt(e.target.value);
    setVolume(vol);
    playerRef.current.setVolume(vol);
    if (vol === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
      playerRef.current.unMute();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      if (volume === 0) {
        setVolume(50);
        playerRef.current.setVolume(50);
      }
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const skip = (sec: number) => {
    if (!playerRef.current) return;
    const newTime = Math.min(Math.max(currentTime + sec, 0), duration);
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Save progress to database
  const saveProgress = async (pct: number, forceComplete: boolean = false) => {
    // Don't save progress if disabled or if video was already completed
    if (disableProgressUpdate || wasCompletedInitially.current) {
      return;
    }
    
    try {
      const roundedPct = Math.round(pct);
      const isComplete = forceComplete || roundedPct >= 100;
      
      await fetch(`/api/courses/${courseSlug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          enrollmentId,
          videoProgress: isComplete ? 100 : roundedPct,
          videoWatched: isComplete,
        }),
      });
    } catch (e) {
      console.error('[YouTubePlayer] Failed to save progress:', e);
    }
  };

  const handleVideoComplete = (currentPct?: number) => {
    if (!hasCompleted) {
      setHasCompleted(true);
      // Always mark as 100% when video is complete
      const completionPct = 100;
      setProgress(completionPct);
      savedCompletedProgress.current = completionPct;
      wasCompletedInitially.current = true;
      
      // Don't pause the video - let it continue playing
      // User can continue watching if they want
      
      // Save progress to mark as completed (force complete flag)
      saveProgress(completionPct, true);
      onComplete?.();
    }
  };

  // Transcript
  const loadTranscript = async () => {
    if (!topicId) return;
    setIsLoadingTranscript(true);
    setTranscriptError(null);
    try {
      const res = await fetch(`/api/topics/${topicId}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, topicTitle, topicDescription }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setTranscript(data.transcript);
      } else {
        // Show specific error message from API
        const errorMsg = data.error || "Failed to generate transcript";
        if (errorMsg.includes("captions") || errorMsg.includes("transcript")) {
          setTranscriptError("This video doesn't have captions available on YouTube. Transcript cannot be generated.");
        } else {
          setTranscriptError(errorMsg);
        }
      }
    } catch (err) {
      console.error('[YouTubePlayer] Transcript error:', err);
      setTranscriptError("Network error - please try again");
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  // --- Render ---

  if (!videoId) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Invalid video URL</p>
      </div>
    );
  }

  // Show loading placeholder until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-xl flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Player Container */}
      <div 
        ref={containerRef}
        className="group relative aspect-video bg-black rounded-xl overflow-hidden shadow-xl"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* YouTube Iframe Container */}
        <div id={playerContainerId} className="absolute inset-0 w-full h-full" />

        {/* Video Error Overlay */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 p-6">
            <div className="text-center max-w-md space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Video Unavailable</h3>
                <p className="text-sm text-white/80 mb-4">{videoError}</p>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Watch on YouTube
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading/Buffering Overlay - Only show when loading or actively buffering while playing */}
        {!videoError && (!isReady || (isBuffering && isPlaying)) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        )}

        {/* Big Play Button (Center) - Only when paused, ready, and NOT completed */}
        {isReady && !isPlaying && !isBuffering && !hasCompleted && (
          <button 
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 z-10 transition-colors"
          >
            <div className="w-20 h-20 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center shadow-lg transition-transform hover:scale-110">
              <Play className="w-10 h-10 text-white ml-1" />
            </div>
          </button>
        )}

        {/* Click-to-pause Overlay (when playing) */}
        {isPlaying && (
          <div className="absolute inset-0 z-5 cursor-pointer" onClick={handlePlayPause} />
        )}

        {/* Custom Controls */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 z-20 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Progress Bar */}
          <div 
            className="group/timeline relative h-1.5 bg-white/30 rounded-full cursor-pointer mb-4 hover:h-2.5 transition-all"
            onClick={handleSeek}
          >
            {/* Progress fill */}
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all" 
              style={{ width: `${progress}%` }}
            />
            {/* Scrubber dot */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg opacity-0 group-hover/timeline:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button onClick={handlePlayPause} className="hover:text-primary transition-colors">
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              {/* Skip buttons */}
              <div className="flex items-center gap-2">
                <button onClick={() => skip(-10)} className="hover:text-primary transition-colors" title="Rewind 10s">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button onClick={() => skip(10)} className="hover:text-primary transition-colors" title="Forward 10s">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 group/volume">
                <button onClick={toggleMute} className="hover:text-primary transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              {/* Time display */}
              <span className="text-xs font-medium tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Completion badge */}
              {hasCompleted && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Complete
                </span>
              )}
              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="hover:text-primary transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Watch Progress Section */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : hasCompleted ? 'bg-green-500' : 'bg-muted-foreground'}`} />
            <span className="text-sm font-medium">Watch Progress</span>
          </div>
          <span className={`text-sm font-semibold ${hasCompleted ? 'text-green-600' : 'text-primary'}`}>
            {Math.round(progress)}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${hasCompleted ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Status message */}
        {hasCompleted ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <p className="text-sm font-medium">Video completed! You can now take the quiz.</p>
          </div>
        ) : progress > 0 ? (
          <p className="text-xs text-muted-foreground">
            Watch {Math.max(0, Math.round(100 - progress))}% more to unlock the quiz
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Watch 100% of the video to mark it as complete
          </p>
        )}
      </div>

      {/* Transcript Section */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <button
          onClick={() => {
            setShowTranscript(!showTranscript);
            if (!transcript && !isLoadingTranscript && !showTranscript) {
              loadTranscript();
            }
          }}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Video Transcript</p>
              <p className="text-xs text-muted-foreground">
                {isLoadingTranscript ? "Generating..." : transcript ? "Read along with the video" : "Generate transcript"}
              </p>
            </div>
          </div>
          {isLoadingTranscript ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : showTranscript ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        
        {showTranscript && (
          <div className="p-4 border-t bg-muted/10">
            {transcriptError ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-medium mb-2">Transcript Unavailable</p>
                <p className="text-xs text-muted-foreground mb-3 max-w-xs mx-auto">{transcriptError}</p>
                <Button onClick={loadTranscript} disabled={isLoadingTranscript} size="sm" variant="outline">
                  Try Again
                </Button>
              </div>
            ) : !transcript ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">Generate a summary and transcript for this video.</p>
                <Button onClick={loadTranscript} disabled={isLoadingTranscript} size="sm">
                  {isLoadingTranscript && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isLoadingTranscript ? "Fetching from YouTube..." : "Generate Transcript"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <h4 className="text-xs font-semibold text-primary mb-1">Summary</h4>
                  <p className="text-sm">{transcript.summary}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground">Key Points</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {transcript.keyPoints.map((pt, i) => <li key={i} className="text-muted-foreground">{pt}</li>)}
                  </ul>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Full Transcript</p>
                  <div className="max-h-60 overflow-y-auto text-sm text-muted-foreground leading-relaxed pr-2">
                    {transcript.transcript}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
