import type { DenominationConfig, DenominationField } from "./denominationFields";

interface WorkflowSectionConfig {
  id: string
  title: string
  description?: string
  fieldKeys?: string[]
  fields?: DenominationField[]
}

interface ProductWorkflowConfig {
  sections: WorkflowSectionConfig[]
}

export interface ResolvedWorkflowSection {
  id: string
  title: string
  description?: string
  fields: DenominationField[]
}

export interface ResolvedProductWorkflow {
  sections: ResolvedWorkflowSection[]
}

const workflowFiles = import.meta.glob('../../../products/*/workflow.json', { eager: true }) as Record<
  string,
  ProductWorkflowConfig
>

export function getWorkflowFields(workflow: ResolvedProductWorkflow): DenominationField[] {
  return workflow.sections.flatMap((section) => section.fields)
}

export function getDenominationWorkflow(
  denominationId: string,
  config: DenominationConfig,
  denominationName: string,
): ResolvedProductWorkflow {
  const key = `../../../products/${denominationId}/workflow.json`
  const workflow = workflowFiles[key]
  if (!workflow) {
    return {
      sections: [
        {
          id: 'lotto',
          title: `Lotto ${denominationName}`,
          fields: config.fields,
        },
      ],
    }
  }

  const fieldsByKey = new Map(config.fields.map((field) => [field.key, field]))

  return {
    sections: workflow.sections.map((section) => {
      const referencedFields = (section.fieldKeys ?? [])
        .map((fieldKey) => fieldsByKey.get(fieldKey))
        .filter((field): field is DenominationField => field !== undefined)
      return {
        id: section.id,
        title: section.title,
        description: section.description,
        fields: [...(section.fields ?? []), ...referencedFields],
      }
    }),
  }
}
