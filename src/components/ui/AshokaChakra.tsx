import React from "react";

interface AshokaChakraProps {
  className?: string;
  size?: number;
}

export default function AshokaChakra({ className = "w-7 h-7", size = 28 }: AshokaChakraProps) {
  return (
    <img
      src="/logos/ashoka-chakra-clean.png"
      alt="Ashoka Chakra"
      width={size}
      height={size}
      className={`object-contain select-none shrink-0 pointer-events-none ${className}`}
      loading="eager"
    />
  );
}
