import { runApp } from "./app/runApp";

runApp().catch((err) => {
  console.error(err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
