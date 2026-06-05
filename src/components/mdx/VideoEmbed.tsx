interface VideoEmbedProps {
  src: string;
  width?: number;
  height?: number;
}

export function VideoEmbed({ src, width = 640, height = 360 }: VideoEmbedProps) {
  return (
    <div className="mt-4">
      <iframe src={src} width={width} height={height} allowFullScreen />
    </div>
  );
}
