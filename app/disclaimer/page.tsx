import LegalPage from "@/components/LegalPage";

export default function DisclaimerPage() {
  return <LegalPage title="DISCLAIMER" updated="August 25, 2026" sections={[
    { heading: "1. No Medical Advice", paragraphs: ["The content on this website and in the programs is provided for informational and educational purposes only. It is not medical advice and does not replace advice from a qualified healthcare professional."] },
    { heading: "2. Injury Waiver", paragraphs: ["Exercise involves inherent risks. By participating, you voluntarily assume responsibility for your health, safety, and any potential injury."] },
    { heading: "3. Results Disclaimer", paragraphs: ["Results vary from person to person. Progress depends on many factors, including consistency, lifestyle, training effort, and individual circumstances. No specific results are guaranteed."] },
    { heading: "4. Fitness Responsibility", paragraphs: ["Before starting any exercise program, consult a qualified healthcare professional, particularly if you have an injury, medical condition, or concern about your ability to exercise.", "Stop exercising and seek appropriate medical attention if you experience pain, dizziness, faintness, unusual shortness of breath, or any other concerning symptoms during exercise."] },
    { heading: "5. Limitation of Liability", paragraphs: ["To the fullest extent permitted by applicable law, by using this website and its programs, you agree that you participate at your own risk. We are not liable for injuries, health issues, losses, or damages related to your participation."] },
    { heading: "6. Technical Disclaimer", paragraphs: ["We are not responsible for internet failures, device issues, or interruptions caused by third-party platforms."] },
  ]} />;
}
