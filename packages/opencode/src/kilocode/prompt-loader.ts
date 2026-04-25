// kilocode_change - new file
import path from "path"
import { Filesystem } from "../util/filesystem"
import { Global } from "../global"
import { Instance } from "../project/instance"
import { Effect } from "effect"

export namespace KiloPromptLoader {
  /**
   * Retrieves a system prompt override if it exists.
   * Checks Instance.worktree/.kilocode/prompts-overrides/<name>.txt
   * and Global.Path.config/prompts-overrides/<name>.txt
   *
   * Returns the override text, or the fallback text if no override exists.
   */
  export function get(name: string, fallback: string): Effect.Effect<string> {
    return Effect.gen(function* () {
      const filename = `${name}.txt`

      // 1. Check workspace
      try {
        const worktree = Instance.worktree
        const localPath = path.join(worktree, ".kilocode", "prompts-overrides", filename)
        const localExists = yield* Effect.promise(() => Filesystem.exists(localPath))
        if (localExists) {
          return yield* Effect.promise(() => Filesystem.readText(localPath))
        }
      } catch (err) {
        // Instance context might not be available
      }

      // 2. Check global
      const globalPath = path.join(Global.Path.config, "prompts-overrides", filename)
      const globalExists = yield* Effect.promise(() => Filesystem.exists(globalPath))
      if (globalExists) {
        return yield* Effect.promise(() => Filesystem.readText(globalPath))
      }

      return fallback
    })
  }

  /**
   * Async version for non-Effect contexts.
   */
  export async function getAsync(name: string, fallback: string): Promise<string> {
    const filename = `${name}.txt`

    // 1. Check workspace
    try {
      const worktree = Instance.worktree
      const localPath = path.join(worktree, ".kilocode", "prompts-overrides", filename)
      if (await Filesystem.exists(localPath)) {
        return await Filesystem.readText(localPath)
      }
    } catch (err) {
      // Instance context might not be available
    }

    // 2. Check global
    try {
      const globalPath = path.join(Global.Path.config, "prompts-overrides", filename)
      if (await Filesystem.exists(globalPath)) {
        return await Filesystem.readText(globalPath)
      }
    } catch (err) {}

    return fallback
  }
}
