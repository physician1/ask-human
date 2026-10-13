# Ask the Human

A Pi extension that exposes a model-callable `ask_user` tool for human-in-the-loop decisions.

The extension allows an agent to pause when it encounters an important unresolved choice, ask the user for input, receive the response, and continue the task using that answer.

## Features

- Select one of the provided options
- Enter a custom response
- Handle cancellation
- Handle empty custom responses safely
- Handle unavailable interactive UI
- Validate malformed tool requests
- Prevent overlapping requests
- Support abort/cancellation signals
- Avoid treating failed or dismissed dialogs as consent

## Requirements

- Node.js
- Pi
- A Pi-compatible model
- Ollama can be used for fully local testing

## Run the Tests

```bash
npm test
```

Expected result:

```text
tests 27
pass 27
fail 0
```

The automated test suite covers option selection, custom responses, cancellation, empty input, unavailable UI, validation, abort behavior, and other edge cases.

## Run the Extension with Pi

This project can be tested locally using Ollama.

Example:

```bash
ollama launch pi --model qwen3:8b
```

Pi should load the project extension:

```text
[Extensions]
ask-user
```

## Demo Example

Give Pi a task containing an unresolved decision:

```text
Create a small Node.js notes application.

There is one important unresolved decision:
the application can use either SQLite or PostgreSQL.

Before choosing the database, you MUST use the ask_user tool to ask me which database I want.

After I answer, continue the task using my choice.
```

The extension presents the user with choices such as:

```text
SQLite
PostgreSQL
Other (type a custom answer)
```

After the user selects an option, the result is returned to the agent:

```text
User answered: SQLite
```

The agent can then continue the task using that decision.

## Project Structure

```text
.
├── docs/
├── src/
├── test/
├── index.js
├── package.json
└── README.md
```

## Important Note

This extension enables consultation between the agent and the human. It is not an enforced approval gate and does not guarantee that a model will identify every unresolved decision automatically.
