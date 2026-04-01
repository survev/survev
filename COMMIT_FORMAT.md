# Commit Message Format
Commit messages should follow a format that includes a `type`, `scope`, `file`, and `subject`.

```fix
<type> (<scope>): (<file>) <subject>
```
Note: `scope` and `file` are optional.

Example - `fix (server): prevent downed players from interacting with objects`

Any line of the commit message cannot be longer than 100 characters. This makes the message easier to read on GitHub as well as in various Git tools.

## Type
Must be one of the following:

* **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation.
* **deploy**: An automated commit, normally from a workflow.
* **docs**: Changes to documentation.
* **enhance**: Minor changes to an existing feature that do not fix bugs.
* **feat**: A new feature, or a significant change to an existing feature.
* **fix**: A code change that fixes a bug.
* **perf**: A code change that improves performance.
* **refactor**: A code change that reimplements an existing feature, but does not alter its functionality.
* **style**: Changes that do not affect the meaning of the code (whitespace, formatting, missing semicolons, etc.)

Multiple types can be expressed as `<type1>+<type2>` in place of `<type>`.

## Scope
The scope is optional and can be anything specifying the location of the commit change.

## File
The file is optional and could specify a change in a specific file. This should be the file's path from the root of the repository; for example, `src/index.ts`.

## Subject
The subject contains succinct description of the change:

* Use the imperative, present tense: `change` not `changed` nor `changes`.
* Do not use a period (.) at the end.
* Do not use markdown formatting.
* Do not capitalize: `fix (server): prevent ...` not `fix (server): Prevent ...`.
