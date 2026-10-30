"use client";

import { FormEvent, useState } from "react";

type Result = { bmr: number };
type AvailableCourse = { title: string; slug: string };

const activityOptions = [
  ["1.2", "1 workout/week or a sedentary lifestyle"],
  ["1.375", "2–3 workouts/week or average daily activity"],
  ["1.55", "3–4 strength workouts/week, plus walking or cardio"],
  ["1.7", "5 demanding strength workouts/week and physical work"],
] as const;

export default function CalorieCalculator({ locked = false, availableCourses = [] }: { locked?: boolean; availableCourses?: AvailableCourse[] }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [activityBmr, setActivityBmr] = useState("");
  const [maintenance, setMaintenance] = useState<number | null>(null);

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const age = Number(data.get("age"));
    const height = Number(data.get("height"));
    const weight = Number(data.get("weight"));
    const sex = String(data.get("sex"));
    if (!age || !height || !weight || !sex || age < 14 || height < 100 || weight < 30) {
      setResult(null); setError("Please enter valid details to calculate your BMR."); return;
    }
    const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161));
    setError("");
    setResult({ bmr });
    setActivityBmr(String(bmr));
    setMaintenance(null);
  }

  function calculateMaintenance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const bmr = Number(data.get("bmr"));
    const activity = Number(data.get("activity"));
    if (!bmr || bmr < 500 || !activity) { setMaintenance(null); return; }
    setMaintenance(Math.round(bmr * activity));
  }

  if (locked) return <main className="calculator-page"><section className="calculator-card calculator-locked"><p className="eyebrow">NUTRITION TOOL</p><h1>Calorie calculator</h1><p className="calculator-intro">This tool is available with selected programs.</p><div className="calculator-locked-message"><strong>Available with purchase</strong><p>Get one of the programs below to unlock the calorie calculator in your account.</p>{availableCourses.length > 0 ? <ul>{availableCourses.map((course) => <li key={course.slug}>{course.title}</li>)}</ul> : <p>Please check back soon for eligible programs.</p>}</div></section></main>;

  return <main className="calculator-page"><section className="calculator-card"><p className="eyebrow">NUTRITION TOOL</p><h1>Calorie calculator</h1><p className="calculator-intro">Calculate your basal metabolic rate.</p>
    <form onSubmit={calculate} className="calculator-form">
      <div className="calculator-grid"><label>Age<input name="age" type="number" min="14" max="100" placeholder="Years" required /></label><label>Height<input name="height" type="number" min="100" max="250" placeholder="cm" required /></label><label>Weight<input name="weight" type="number" min="30" max="300" step="0.1" placeholder="kg" required /></label><label>Sex<select name="sex" defaultValue=""><option value="" disabled>Select</option><option value="female">Female</option><option value="male">Male</option></select></label></div>
      <button className="button dark" type="submit">CALCULATE BMR</button>{error && <p className="calculator-error">{error}</p>}
    </form>
    {result && <section className="calculator-result calculator-bmr-result" aria-live="polite"><article><span>Your estimated BMR</span><strong>{result.bmr} kcal</strong><small>per day at complete rest</small></article><small>This is an estimate, not medical advice.</small></section>}
    <section className="calculator-guide"><details><summary>I. Basal metabolic rate formula</summary><p><strong>BMR</strong> is the minimum number of calories your body needs to maintain vital functions at rest. This number is the starting point for all further calculations.</p><p>The calculator above uses the Mifflin–St Jeor formula. Example for a woman: height 165 cm, weight 60 kg, age 22 — her BMR is approximately <strong>1,360 kcal</strong>.</p></details><details><summary>II. Activity factor and calorie maintenance</summary><p>Multiply your BMR by the activity factor that best describes your usual lifestyle. The result is your daily calorie maintenance — the amount that should keep your body weight stable.</p><ul>{activityOptions.map(([value, label]) => <li key={value}><strong>{value}</strong> — {label}</li>)}</ul><p>Example: 1,360 kcal × 1.2 = <strong>1,630 kcal maintenance</strong>.</p><form className="activity-mini-calculator" onSubmit={calculateMaintenance}><p className="activity-mini-title">Calculate your maintenance calories</p><label>Your BMR<input name="bmr" type="number" min="500" value={activityBmr} onChange={(event) => setActivityBmr(event.target.value)} placeholder="For example: 1360" required /></label><label>Activity level<select name="activity" defaultValue="1.55">{activityOptions.map(([value, label]) => <option value={value} key={value}>{value} — {label}</option>)}</select></label><button className="button dark" type="submit">CALCULATE</button>{maintenance && <p className="activity-mini-result">Your estimated maintenance: <strong>{maintenance} kcal/day</strong></p>}</form></details><details><summary>III. Calories for your goal</summary><p>Choose the approach that matches your goal:</p><ul><li><strong>Fat loss:</strong> subtract 300–400 kcal from maintenance.</li><li><strong>Recomposition:</strong> subtract 100–300 kcal to reduce body fat while building muscle.</li><li><strong>Muscle gain:</strong> add 100–200 kcal to maintenance.</li></ul><p>For example, from 1,630 kcal: 1,300 kcal for fat loss, 1,500 kcal for recomposition, or 1,750 kcal for muscle gain.</p></details><details><summary>IV. Protein and fat targets</summary><p>Set your protein and fat intake first. Use these daily ranges based on body weight:</p><ul><li><strong>Protein:</strong> 1.4–2.0 g per kg of body weight</li><li><strong>Fat:</strong> 0.8–1.2 g per kg of body weight</li></ul><p>For a 60 kg person, a practical example is 102 g protein (1.7 g/kg) and 60 g fat (1.0 g/kg).</p></details><details><summary>V. Carbohydrates and final macros</summary><p>Carbohydrates are calculated from the calories left after protein and fat. Protein and carbohydrates provide 4 kcal per gram; fat provides 9 kcal per gram.</p><p>Example for 1,500 kcal: 102 g protein × 4 = 408 kcal, and 60 g fat × 9 = 540 kcal. That leaves 552 kcal for carbohydrates: 552 ÷ 4 = <strong>138 g carbs</strong>.</p><p><strong>Final example for recomposition:</strong> 1,500 kcal, 102 g protein, 60 g fat, and 138 g carbohydrates per day.</p></details></section>
  </section></main>;
}
