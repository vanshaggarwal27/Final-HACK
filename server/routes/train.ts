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

export const trainHandler: RequestHandler = async (req, res) => {
  try {
    console.log("Starting model training...");

    // Execute Python training script
    const scriptPath = path.join(process.cwd(), "python", "model.py");
    const result = await executePythonScript(scriptPath);

    res.json(result);
  } catch (error) {
    console.error("Training error:", error);
    res.status(500).json({
      status: "error",
      message: "Model training failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
