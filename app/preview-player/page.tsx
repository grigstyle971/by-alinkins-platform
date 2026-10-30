import ProgramPlayer from "@/components/ProgramPlayer";

// Temporary local-only screen for reviewing the course interface without Supabase login.
export default function PreviewPlayerPage() {
  return <ProgramPlayer courseTitle="Course preview" />;
}
