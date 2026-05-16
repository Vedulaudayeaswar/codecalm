package upload

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"time"
)

type DockerRunner struct {
	MemoryLimit string
	CPULimit    string
	Timeout     time.Duration
}

type RunResult struct {
	Image string `json:"image"`
	Logs  string `json:"logs"`
}

// BuildAndRun shells out to Docker so the service can remain small and easy to
// deploy. Production clusters should run this behind a hardened worker node.
func (r DockerRunner) BuildAndRun(ctx context.Context, submissionID, dir string) (RunResult, error) {
	if r.MemoryLimit == "" {
		r.MemoryLimit = "256m"
	}
	if r.CPULimit == "" {
		r.CPULimit = "0.5"
	}
	if r.Timeout == 0 {
		r.Timeout = 10 * time.Second
	}

	image := "codetest-submission:" + submissionID
	docker, err := dockerExecutable()
	if err != nil {
		return RunResult{Image: image}, err
	}

	buildLogs, err := runCommand(ctx, r.Timeout, docker, "build", "-t", image, dir)
	if err != nil {
		return RunResult{Image: image, Logs: buildLogs}, fmt.Errorf("docker build failed: %w", err)
	}

	runLogs, err := runCommand(ctx, r.Timeout, docker, "run", "--rm", "--network=none", "--memory", r.MemoryLimit, "--cpus", r.CPULimit, image)
	if err != nil {
		return RunResult{Image: image, Logs: buildLogs + "\n" + runLogs}, fmt.Errorf("docker run failed: %w", err)
	}

	return RunResult{Image: image, Logs: buildLogs + "\n" + runLogs}, nil
}

func runCommand(ctx context.Context, timeout time.Duration, name string, args ...string) (string, error) {
	cmdCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	cmd := exec.CommandContext(cmdCtx, name, args...)
	var output bytes.Buffer
	cmd.Stdout = &output
	cmd.Stderr = &output
	err := cmd.Run()
	if cmdCtx.Err() == context.DeadlineExceeded {
		return output.String(), fmt.Errorf("%s timed out after %s", name, timeout)
	}
	return output.String(), err
}

func dockerExecutable() (string, error) {
	if path, err := exec.LookPath("docker"); err == nil {
		return path, nil
	}

	if runtime.GOOS == "windows" {
		candidates := []string{
			`C:\Program Files\Docker\Docker\resources\bin\docker.exe`,
			`C:\Program Files\Docker\Docker\resources\docker.exe`,
		}
		for _, candidate := range candidates {
			if _, err := os.Stat(candidate); err == nil {
				return candidate, nil
			}
		}
	}

	return "", fmt.Errorf("docker executable not found; install Docker Desktop and make sure it is running")
}
