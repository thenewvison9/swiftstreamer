import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Volume2, Volume1, VolumeX, Play, Pause, Settings, Loader2, RotateCcw, RotateCw, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface VideoPlayerProps {
  url: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimeoutRef = useRef<number>();
  const hlsRef = useRef<Hls | null>(null);
  const isMobile = useIsMobile();

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

    video.addEventListener('timeupdate', handleTimeUpdate);
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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value;
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full bg-black group transition-all duration-300",
        isFullscreen ? "h-screen" : "aspect-video"
      )}
    >
      {(loading || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="w-12 h-12 text-[#ea384c] animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        playsInline
        onClick={handlePlayPause}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1F2C]/90 via-[#1A1F2C]/50 to-transparent px-4 py-6">
        <div className="flex flex-col gap-3 max-w-screen-lg mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={handlePlayPause} className="text-white hover:text-[#ea384c] transition-colors">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-white hover:text-[#ea384c]">
                {volume === 0 ? <VolumeX className="w-6 h-6" /> : volume < 0.5 ? <Volume1 className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 accent-[#ea384c] bg-[#403E43] rounded-full cursor-pointer"
              />
            </div>
            <span className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <button onClick={toggleFullscreen} className="text-white hover:text-[#ea384c] transition-colors ml-auto">
              {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
