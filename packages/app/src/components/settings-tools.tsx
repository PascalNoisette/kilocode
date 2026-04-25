import { Component, createResource, createSignal, For, Show } from "solid-js"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { Icon } from "@opencode-ai/ui/icon"
import { showToast } from "@opencode-ai/ui/toast"
import { Switch } from "@opencode-ai/ui/switch"

export const SettingsTools: Component = () => {
  const sdk = useSDK()
  const sync = useSync()
  const [updating, setUpdating] = createSignal(false)

  const [tools] = createResource(async () => {
    try {
      const response = await sdk.client.app.tools()
      return response.data as { id: string; description: string }[]
    } catch (e) {
      console.error(e)
      return []
    }
  })

  const agents = () => (sync.data as any).agent.filter((a: any) => !a.hidden)

  const isEnabled = (agentName: string, toolId: string) => {
    const agent = agents().find((a: any) => a.name === agentName)
    if (!agent || !agent.permission) return true
    if (toolId in agent.permission) {
       return (agent.permission as any)[toolId] !== "deny"
    }
    if ("*" in agent.permission) {
       return (agent.permission as any)["*"] !== "deny"
    }
    return true
  }

  const togglePermission = async (agentName: string, toolId: string, enabled: boolean) => {
    setUpdating(true)
    try {
      const action = enabled ? "allow" : "deny"
      await sdk.client.config.update({
        config: {
          agent: {
            [agentName]: {
              permission: {
                [toolId]: action
              }
            }
          }
        }
      })
      showToast({ title: "Configuration Updated", description: "Changes saved to Kilo configuration." })
      // Trigger a refresh/resync of agents? The global sync might catch it automatically via SSE
    } catch (e) {
      showToast({ title: "Failed to update configuration", variant: "error" })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div class="flex flex-col gap-6 p-4 overflow-x-auto w-full">
      <div>
        <h2 class="text-xl font-bold mb-2">Configure Agent Tools</h2>
        <p class="text-xs opacity-75 max-w-2xl">
          Enable or disable specific tools (including MCP tools) for each agent.
          Changes are automatically saved to your kilo.json configuration file. 
          Disabling unused tools heavily reduces token usage and improves LLM performance.
        </p>
      </div>

      <Show when={tools.loading || !tools()}>
        <div class="flex items-center gap-2 opacity-50">
          <Icon name="history" class="animate-spin" />
          <span>Loading tool matrix...</span>
        </div>
      </Show>

      <Show when={tools()}>
        <div class="overflow-x-auto border border-border rounded-lg no-scrollbar">
          <table class="w-full text-left border-collapse min-w-max">
            <thead>
              <tr>
                <th class="p-3 border-b border-r border-border bg-muted/30 font-medium text-sm sticky left-0 z-10 w-64 shadow-[1px_0_0_var(--border)]">
                  Tool
                </th>
                <For each={agents()}>
                  {(agent) => (
                    <th class="p-3 border-b border-border bg-muted/10 font-medium text-sm min-w-24 text-center">
                      <div class="flex flex-col items-center gap-1">
                        <Icon name={agent.icon} class="w-4 h-4 opacity-75" />
                        <span class="capitalize">{agent.name}</span>
                      </div>
                    </th>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={tools()}>
                {(tool) => (
                  <tr class="hover:bg-muted/10">
                    <td class="p-3 border-b border-r border-border sticky left-0 bg-background z-10 shadow-[1px_0_0_var(--border)]">
                      <div class="flex flex-col gap-1 w-60">
                        <span class="font-medium text-sm break-all">{tool.id}</span>
                        <span class="text-[10px] opacity-60 leading-tight line-clamp-2" title={tool.description}>
                          {tool.description}
                        </span>
                      </div>
                    </td>
                    <For each={agents()}>
                      {(agent) => {
                        const checked = () => isEnabled(agent.name, tool.id)
                        return (
                          <td class="p-3 border-b border-border text-center align-middle">
                            <Switch
                              disabled={updating()}
                              checked={checked()}
                              onChange={(val) => togglePermission(agent.name, tool.id, val)}
                              class="mx-auto"
                            />
                          </td>
                        )
                      }}
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
