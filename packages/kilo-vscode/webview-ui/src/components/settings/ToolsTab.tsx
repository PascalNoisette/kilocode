import { Component, For, onMount, Show } from "solid-js"
import { useSession } from "../../context/session"
import { useConfig } from "../../context/config"
import { useLanguage } from "../../context/language"
import { Switch } from "@kilocode/kilo-ui/switch"

export const ToolsTab: Component = () => {
  const { tools, refreshTools, allAgents } = useSession()
  const { config, updateConfig } = useConfig()
  const { t } = useLanguage()

  onMount(() => {
    refreshTools()
  })

  const agents = () => allAgents().filter((a) => !a.hidden)

  const isEnabled = (name: string, id: string) => {
    const agentCfg = config().agent?.[name]
    if (!agentCfg?.permission) return true
    const perm = agentCfg.permission
    if (id in perm) return perm[id] !== "deny"
    if ("*" in perm) return perm["*"] !== "deny"
    return true
  }

  const togglePermission = (name: string, id: string, val: boolean) => {
    const action = val ? "allow" : "deny"
    updateConfig({
      agent: {
        [name]: {
          permission: {
            [id]: action,
          },
        },
      },
    })
  }

  return (
    <div class="settings-tools-container">
      <p class="settings-tools-description">{t("settings.tools.description")}</p>

      <Show
        when={tools().length > 0}
        fallback={
          <div class="settings-tools-loading">
            <span class="animate-spin">&#x21BB;</span>
            <span>{t("settings.tools.loading")}</span>
          </div>
        }
      >
        <div class="settings-tools-matrix-wrap">
          <table class="settings-tools-matrix">
            <thead>
              <tr>
                <th class="settings-tools-matrix-tool-header">Tool</th>
                <For each={agents()}>
                  {(agent) => (
                    <th class="settings-tools-matrix-agent-header">
                      <div class="settings-tools-matrix-agent-info">
                        <span>{agent.displayName || agent.name}</span>
                      </div>
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={tools()}>
                {(tool) => (
                  <tr class="settings-tools-matrix-row">
                    <td class="settings-tools-matrix-tool-cell">
                      <div class="settings-tools-matrix-tool-info">
                        <span class="settings-tools-matrix-tool-id">{tool.id}</span>
                        <span class="settings-tools-matrix-tool-description" title={tool.description}>
                          {tool.description}
                        </span>
                      </div>
                    </td>
                    <For each={agents()}>
                      {(agent) => (
                        <td class="settings-tools-matrix-switch-cell">
                          <Switch
                            checked={isEnabled(agent.name, tool.id)}
                            onChange={(val) => togglePermission(agent.name, tool.id, val)}
                            hideLabel
                          />
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  )
}
