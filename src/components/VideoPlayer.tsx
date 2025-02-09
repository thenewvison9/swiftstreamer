
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Volume2, Volume1, VolumeX, Play, Pause, Settings, Loader2, RotateCcw, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  url: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<{ height: number; level: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const controlsTimeoutRef = useRef<number>();
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1,
        capLevelToPlayerSize: true,
        debug: false,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const availableQualities = data.levels.map((level, index) => ({
          height: level.height,
          level: index,
        }));
        setQualities(availableQualities);
        setLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Failed to load video stream');
          setLoading(false);
        }
      });

      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('playing', handlePlaying);

      return () => {
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
        hls.destroy();
      };
    }
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    };

    video.addEventListener('timeupload', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
  };

  const handleTimeSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  if (error) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center bg-black text-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[60vh] bg-black group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {(loading || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        onClick={handlePlayPause}
      />

      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 py-6 transition-all duration-300",
        showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div className="flex flex-col gap-3 max-w-screen-lg mx-auto">
          {/* Progress bar */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleTimeSeek}
            className="w-full h-1 accent-red-500 bg-gray-600 rounded-full appearance-none cursor-pointer"
          />

          <div className="flex items-center gap-4">
            {/* Play/Pause button */}
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-red-500 transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Skip buttons */}
            <button
              onClick={() => handleSkip(-10)}
              className="text-white hover:text-red-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSkip(10)}
              className="text-white hover:text-red-500 transition-colors"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-2 w-32">
              {volume === 0 ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 accent-red-500 bg-gray-600 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Time display */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Settings menu */}
            <div className="relative group ml-auto">
              <button className="text-white hover:text-red-500 transition-colors">
                <Settings className="w-6 h-6" />
              </button>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-black/95 rounded-lg p-3 min-w-[180px] backdrop-blur-sm border border-white/10">
                <div className="text-white/80 text-sm mb-2 font-medium">Playback Speed</div>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={cn(
                      "block w-full text-left px-3 py-1.5 text-sm rounded transition-colors",
                      playbackSpeed === speed 
                        ? "text-red-500 bg-white/5" 
                        : "text-white hover:text-red-500 hover:bg-white/5"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
                {qualities.length > 0 && (
                  <>
                    <div className="text-white/80 text-sm mt-3 mb-2 font-medium border-t border-white/10 pt-3">
                      Quality
                    </div>
                    {qualities.map(({ height, level }) => (
                      <button
                        key={level}
                        onClick={() => handleQualityChange(level)}
                        className={cn(
                          "block w-full text-left px-3 py-1.5 text-sm rounded transition-colors",
                          currentQuality === level 
                            ? "text-red-500 bg-white/5" 
                            : "text-white hover:text-red-500 hover:bg-white/5"
                        )}
                      >
                        {height}p
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
