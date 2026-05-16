package upload

import (
	"fmt"
	"path/filepath"
	"strings"
)

type Language string

const (
	LanguagePython Language = "python"
	LanguageCPP    Language = "cpp"
	LanguageGo     Language = "go"
)

// DetectLanguage keeps language selection deterministic and auditable.
func DetectLanguage(filename string) (Language, error) {
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".py":
		return LanguagePython, nil
	case ".cpp", ".cc", ".cxx":
		return LanguageCPP, nil
	case ".go":
		return LanguageGo, nil
	default:
		return "", fmt.Errorf("unsupported file extension for %q", filename)
	}
}

// DockerfileFor creates a minimal runner image per language. The uploaded file
// is copied as main.<ext> and executed without privileged capabilities.
func DockerfileFor(lang Language, sourceName string) (string, error) {
	switch lang {
	case LanguagePython:
		return fmt.Sprintf(`FROM python:3.12-alpine
WORKDIR /runner
COPY %s /runner/main.py
USER nobody
CMD ["python", "/runner/main.py"]
`, sourceName), nil
	case LanguageCPP:
		return fmt.Sprintf(`FROM gcc:13 AS build
WORKDIR /src
COPY %s /src/main.cpp
RUN g++ -O2 -std=c++17 /src/main.cpp -o /src/app

FROM debian:bookworm-slim
WORKDIR /runner
COPY --from=build /src/app /runner/app
USER nobody
CMD ["/runner/app"]
`, sourceName), nil
	case LanguageGo:
		return fmt.Sprintf(`FROM golang:1.22-alpine AS build
WORKDIR /src
COPY %s /src/main.go
RUN go build -o /src/app /src/main.go

FROM alpine:3.20
WORKDIR /runner
COPY --from=build /src/app /runner/app
USER nobody
CMD ["/runner/app"]
`, sourceName), nil
	default:
		return "", fmt.Errorf("no Dockerfile template for language %q", lang)
	}
}
