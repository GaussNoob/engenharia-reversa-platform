import { Link } from "@nucleo/platform";
import { ArrowUpRight } from "lucide-react";
import { exerciseHref, type PublicExercise } from "@nucleo/core";
export function ExerciseLinks({ exercises }: { exercises: PublicExercise[] }) {
  if (!exercises.length) return null;
  return (
    <section className="related-exercises">
      <span className="overline">PRATIQUE O QUE VOCÊ ACABOU DE APRENDER</span>
      <h3>
        {exercises.length}{" "}
        {exercises.length === 1
          ? "exercício complementar"
          : "exercícios complementares"}
      </h3>
      <div>
        {exercises.map((exercise) => (
          <Link href={exerciseHref(exercise)} key={exercise.id}>
            <span>
              <strong>{exercise.title}</strong>
              <small>
                {exercise.difficulty} · {exercise.minutes} min
              </small>
            </span>
            <ArrowUpRight size={15} />
          </Link>
        ))}
      </div>
    </section>
  );
}
