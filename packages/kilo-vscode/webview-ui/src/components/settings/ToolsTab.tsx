import { Component, For, onMount, Show } from "solid-js"
import { useSession } from "../../context/session"
import { useConfig } from "../../context/config"
import { useLanguage } from "../../context/language"
import { Icon } from "@kilocode/kilo-ui/icon"
import { Checkbox } from "@kilocode/kilo-ui/checkbox"

export const ToolsTab: Component = () => {
  const { tools, refreshTools, allAgents } = useSession()
  const { config, updateConfig } = useConfig()
  const { t } = useLanguage()

  onMount(() => {
    refreshTools()
  })

  const agents = () => allAgents().filter((a) => !a.hidden)

  const isEnabled = (agentName: string, toolId: string) => {
    const agent = config().agent?.[agentName]
    if (!agent || !agent.permission) return true

    const permission = agent.permission as Record<string, string>
    if (toolId in permission) {
      return permission[toolId] !== "deny"
    }
    if ("*" in permission) {
      return permission["*"] !== "deny"
    }
    return true
  }

  const togglePermission = (agentName: string, toolId: string, enabled: boolean) => {
    const action = enabled ? "allow" : "deny"
    updateConfig({
      agent: {
        [agentName]: {
          permission: {
            [toolId]: action,
          },
        },
      },
    })
  }

  const isToolEnabledForAllAgents = (toolId: string) => {
    return agents().every((agent) => isEnabled(agent.name, toolId))
  }

  const toggleAllAgentsForTool = (toolId: string, enabled: boolean) => {
    const action = enabled ? "allow" : "deny"
    const agentConfigs: Record<string, any> = {}
    for (const agent of agents()) {
      agentConfigs[agent.name] = {
        permission: {
          [toolId]: action,
        },
      }
    }
    updateConfig({
      agent: agentConfigs,
    })
  }

  return (
    <div class="settings-tools-container">
      <div class="settings-tools-header">
        <p class="settings-tools-description">{t("settings.tools.description")}</p>
      </div>

      <Show
        when={tools().length > 0}
        fallback={
          <div class="settings-tools-loading">
            <Icon name="history" class="animate-spin" />
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
                        <Icon name="brain" size="small" style={{ color: agent.color }} />
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
                      <div class="settings-tools-matrix-tool-details" onClick={() => toggleAllAgentsForTool(tool.id, !isToolEnabledForAllAgents(tool.id))}>
                        <span class="settings-tools-matrix-tool-id">{tool.id}</span>
                        <span class="settings-tools-matrix-tool-description" title={tool.description}>
                          {tool.description}
                        </span>
                      </div>
                    </td>
                    <For each={agents()}>
                      {(agent) => (
                        <td class="settings-tools-matrix-checkbox-cell">
                          <Checkbox
                            checked={isEnabled(agent.name, tool.id)}
                            onChange={(val) => togglePermission(agent.name, tool.id, val)}
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
