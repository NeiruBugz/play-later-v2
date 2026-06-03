export type LightboxImage = {
  src: string;
  alt: string;
};

export type ImageLightboxProps = {
  images: LightboxImage[];
  open: boolean;
  index: number;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
};
