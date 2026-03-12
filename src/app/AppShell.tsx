"use client";
import { useStore }     from "@/lib/store";
import { BootScreen }   from "@/components/shell/BootScreen";
import { CustomCursor } from "@/components/shell/CustomCursor";
import { Nav }          from "@/components/shell/Nav";

interface AppShellProps {
  children:      React.ReactNode;
  steamLinked?:  boolean;
  steamUsername?: string;
}

export default function AppShell({ children, steamLinked, steamUsername }: AppShellProps) {
  const booted = useStore((s) => s.booted);

  return (
    <>
      <CustomCursor />

      {/* Boot screen renders until user clicks Enter */}
      {!booted && <BootScreen />}

      {/* Main app — fades in after boot */}
      <div
        className="sl"
        style={{ opacity: booted ? 1 : 0, transition: "opacity 0.5s 0.1s" }}
      >
        <Nav steamLinked={steamLinked} steamUsername={steamUsername} />
        <main style={{ paddingTop: 52, minHeight: "100vh" }}>
          {children}
        </main>
      </div>
    </>
  );
}
