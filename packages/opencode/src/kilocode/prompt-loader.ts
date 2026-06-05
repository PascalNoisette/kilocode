// kilocode_change - new file
import fs from "fs"
import path from "path"
import { Global } from "@opencode-ai/core/global"
import { Filesystem } from "@/util/filesystem"
import { AppFileSystem } from "@opencode-ai/core/filesystem"
import { Instance } from "@/project/instance"
import { Effect } from "effect"

export namespace KiloPromptLoader {
  /**
   * Retrieves a system prompt override if it exists.
   * Checks <worktree>/.kilocode/prompts-overrides/<name>.txt
   * and Global.Path.config/prompts-overrides/<name>.txt
   *
   * Returns the override text, or the fallback text if no override exists.
   */
  export function get(
    name: string,
    fallback: string,
    fsys: AppFileSystem.Interface,
  ): Effect.Effect<string, never, never> {
    return Effect.gen(function* () {
      const filename = `${name}.txt`

      // 1. Check workspace
      try {
        const ctx = Instance.current
        const localPath = path.join(ctx.worktree, ".kilocode", "prompts-overrides", filename)
        const localExists = yield* fsys.existsSafe(localPath)
        if (localExists) {
          const text = yield* fsys.readFileStringSafe(localPath).pipe(Effect.orElseSucceed(() => undefined))
          if (text !== undefined) return text
        }
      } catch {
        // Instance context might not be available
      }

      // 2. Check global
      const globalPath = path.join(Global.Path.config, "prompts-overrides", filename)
      const globalExists = yield* fsys.existsSafe(globalPath)
      if (globalExists) {
        const text = yield* fsys.readFileStringSafe(globalPath).pipe(Effect.orElseSucceed(() => undefined))
        if (text !== undefined) return text
      }

      return fallback
    })
  }

  /**
   * Synchronous version for use outside Effect contexts.
   * Falls back to the fallback text on any error.
   */
  export function getSync(name: string, fallback: string): string {
    const filename = `${name}.txt`

    // 1. Check workspace
    try {
      const ctx = Instance.current
      const localPath = path.join(ctx.worktree, ".kilocode", "prompts-overrides", filename)
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath, "utf-8")
      }
    } catch {
      // Instance context might not be available
    }

    // 2. Check global
    const globalPath = path.join(Global.Path.config, "prompts-overrides", filename)
    if (fs.existsSync(globalPath)) {
      return fs.readFileSync(globalPath, "utf-8")
    }

    return fallback
  }

  /**
   * Async version for non-Effect contexts.
   */
  export async function getAsync(name: string, fallback: string): Promise<string> {
    const filename = `${name}.txt`

    // 1. Check workspace
    try {
      const ctx = Instance.current
      const localPath = path.join(ctx.worktree, ".kilocode", "prompts-overrides", filename)
      if (await Filesystem.exists(localPath)) {
        return await Filesystem.readText(localPath)
      }
    } catch {
      // Instance context might not be available
    }

    // 2. Check global
    const globalPath = path.join(Global.Path.config, "prompts-overrides", filename)
    if (await Filesystem.exists(globalPath)) {
      return await Filesystem.readText(globalPath)
    }

    return fallback
  }
}
