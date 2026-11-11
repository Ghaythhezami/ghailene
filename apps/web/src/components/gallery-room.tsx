"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, useTexture } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import type { PublicArtwork } from "@basmat-fan/shared";

const framePositions: Array<[number, number, number]> = [
  [-5.7, 0.1, -1.7],
  [5.7, 0.1, -1.7],
  [-4.3, -0.5, -2.2],
  [4.3, -0.5, -2.2],
  [-5.9, 1.35, -2.4],
  [5.9, 1.35, -2.4],
];

const frameColors = ["#d0a04e", "#36a8aa", "#d56b50", "#a46bc1", "#529264", "#df9348"];

function ArtworkTexture({ url }: { url: string }) {
  const texture = useTexture(url);
  return <mesh position={[0, 0, 0.1]}><planeGeometry args={[0.98, 1.3]} /><meshStandardMaterial map={texture} roughness={0.65} /></mesh>;
}

function ArtworkFrame({
  position, color, artwork, onSelect,
}: {
  position: [number, number, number];
  color: string;
  artwork: PublicArtwork;
  onSelect: (artwork: PublicArtwork) => void;
}) {
  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(artwork);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => { document.body.style.cursor = "auto"; }}
    >
      <mesh>
        <boxGeometry args={[1.16, 1.48, 0.11]} />
        <meshStandardMaterial color="#d8ae5b" emissive="#d79c32" emissiveIntensity={0.08} roughness={0.4} metalness={0.22} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[1.01, 1.33, 0.02]} />
        <meshStandardMaterial color="#382b23" roughness={0.65} />
      </mesh>
      {artwork.images[0] && <Suspense fallback={null}><ArtworkTexture url={artwork.images[0].url} /></Suspense>}
    </group>
  );
}

function GalleryScene({ artworks, onSelect }: { artworks: PublicArtwork[]; onSelect: (artwork: PublicArtwork) => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <>
      <ambientLight intensity={0.9} />
      {artworks.slice(0, framePositions.length).map((artwork, index) => {
        const [x, y, z] = framePositions[index];
        return (
          <group key={artwork.id}>
            <spotLight position={[x, y + 1.5, z + 1.4]} angle={0.35} penumbra={0.85} intensity={14} color="#ffdfaa" />
            <Float speed={reduceMotion ? 0 : 0.45} rotationIntensity={reduceMotion ? 0 : 0.04} floatIntensity={reduceMotion ? 0 : 0.04}>
              <ArtworkFrame artwork={artwork} onSelect={onSelect} position={[x, y, z]} color={frameColors[index]} />
            </Float>
          </group>
        );
      })}
      {[-1, 1].map((side) => (
        <Float key={side} speed={reduceMotion ? 0 : 0.4} rotationIntensity={reduceMotion ? 0 : 0.08} floatIntensity={reduceMotion ? 0 : 0.06}>
          <mesh position={[side * 5.2, 1.9, -1.8]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color={side === -1 ? "#edbd65" : "#79c1ba"} emissive={side === -1 ? "#b77737" : "#277871"} emissiveIntensity={0.38} metalness={0.35} roughness={0.25} />
          </mesh>
        </Float>
      ))}
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </>
  );
}

export default function GalleryRoom({
  artworks = [], onSelect = () => undefined,
}: {
  artworks?: PublicArtwork[];
  onSelect?: (artwork: PublicArtwork) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (mobile) return <div className="gallery-mobile-fallback" aria-hidden="true" />;

  return (
    <Canvas
      fallback={<div className="gallery-2d-fallback" role="img" aria-label="قاعة فنية مضاءة بلوحات الطلاب">قاعة بصمة فن · أعمال فنية في مساحة معرض هادئة</div>}
      shadows={false}
      frameloop={reduceMotion ? "demand" : "always"}
      camera={{ position: [0, 0.65, 6.4], fov: 43 }}
      dpr={[1, 1.3]}
      gl={{ alpha: true, antialias: !reduceMotion, powerPreference: "low-power" }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}><GalleryScene artworks={artworks} onSelect={onSelect} /></Suspense>
    </Canvas>
  );
}
