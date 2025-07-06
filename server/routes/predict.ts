import { RequestHandler } from "express";
import { spawn } from "child_process";
import path from "path";

function executePythonScript(
  scriptPath: string,
  args: string[] = [],
): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [scriptPath, ...args], {
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          const lines = stdout.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (e) {
          resolve({ status: "success", message: stdout });
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });

    python.on("error", (error) => {
      reject(error);
    });
  });
}

export const predictHandler: RequestHandler = async (req, res) => {
  try {
    const { category, store, start_date, end_date } = req.body;

    console.log("Generating predictions for:", {
      category,
      store,
      start_date,
      end_date,
    });

    // Execute Python prediction script
    const scriptPath = path.join(process.cwd(), "python", "pred.py");
    const params = JSON.stringify({ category, store, start_date, end_date });
    const result = await executePythonScript(scriptPath, [params]);

    res.json(result);
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({
      status: "error",
      message: "Prediction generation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
