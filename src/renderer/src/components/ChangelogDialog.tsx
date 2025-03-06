import { Search, ChevronRight, Code, Layout, CalendarIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { changelog, ChangeTypeColors, AreaTypeColors } from '../data/changelog'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { Card, CardContent } from './ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Separator } from './ui/separator'

interface ChangelogDialogProps {
  open: boolean
  onClose: () => void
}

export function ChangelogDialog({ open, onClose }: ChangelogDialogProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)

  const filteredChangelog = changelog.filter(
    (entry) =>
      entry.version.toLowerCase().includes(search.toLowerCase()) ||
      entry.title.toLowerCase().includes(search.toLowerCase()) ||
      entry.summary.toLowerCase().includes(search.toLowerCase()) ||
      entry.changes.some(
        (change) =>
          change.title.toLowerCase().includes(search.toLowerCase()) ||
          change.description.toLowerCase().includes(search.toLowerCase()) ||
          (change.technical_details &&
            change.technical_details.toLowerCase().includes(search.toLowerCase())) ||
          (change.affected_areas &&
            change.affected_areas.some((area) => area.toLowerCase().includes(search.toLowerCase())))
      )
  )

  const getChangeTypeCount = (entry: (typeof changelog)[0]): Record<string, number> => {
    const counts = {
      added: 0,
      changed: 0,
      fixed: 0,
      removed: 0
    }
    entry.changes.forEach((change) => {
      counts[change.type]++
    })
    return counts
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Changelog</DialogTitle>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search changes..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[600px] pr-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredChangelog.map((entry) => {
              const counts = getChangeTypeCount(entry)
              const isExpanded = expandedVersion === entry.version

              return (
                <Collapsible
                  key={entry.version}
                  open={isExpanded}
                  onOpenChange={() => setExpandedVersion(isExpanded ? null : entry.version)}
                  className={cn(
                    'col-span-1 group transition-all duration-200',
                    isExpanded && 'md:col-span-2'
                  )}
                >
                  <Card
                    className={cn(
                      'transition-all duration-200 border',
                      isExpanded
                        ? 'bg-muted/50 ring-2 ring-primary/10'
                        : 'hover:bg-muted/30 hover:shadow-md cursor-pointer'
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold tracking-tight">
                                  Version {entry.version}
                                </h3>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <CalendarIcon className="h-3.5 w-3.5" />
                                  <span>{entry.date}</span>
                                </div>
                              </div>
                              <p className="text-sm font-medium text-primary/90">{entry.title}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {entry.summary}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1.5">
                                {counts.added > 0 && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'transition-colors',
                                      ChangeTypeColors.added.light,
                                      ChangeTypeColors.added.dark
                                    )}
                                  >
                                    +{counts.added}
                                  </Badge>
                                )}
                                {counts.changed > 0 && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'transition-colors',
                                      ChangeTypeColors.changed.light,
                                      ChangeTypeColors.changed.dark
                                    )}
                                  >
                                    ~{counts.changed}
                                  </Badge>
                                )}
                                {counts.fixed > 0 && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'transition-colors',
                                      ChangeTypeColors.fixed.light,
                                      ChangeTypeColors.fixed.dark
                                    )}
                                  >
                                    #{counts.fixed}
                                  </Badge>
                                )}
                                {counts.removed > 0 && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'transition-colors',
                                      ChangeTypeColors.removed.light,
                                      ChangeTypeColors.removed.dark
                                    )}
                                  >
                                    -{counts.removed}
                                  </Badge>
                                )}
                              </div>
                              <ChevronRight
                                className={cn(
                                  'h-4 w-4 transition-transform text-muted-foreground/50',
                                  isExpanded && 'rotate-90',
                                  'group-hover:text-muted-foreground'
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Separator />
                      <CardContent className="px-6 py-4">
                        <div className="space-y-8">
                          {['added', 'changed', 'fixed', 'removed'].map((type) => {
                            const changes = entry.changes.filter((c) => c.type === type)
                            if (changes.length === 0) return null

                            return (
                              <div key={type} className="space-y-4">
                                <h4 className="font-medium capitalize flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'transition-colors',
                                      ChangeTypeColors[type as keyof typeof ChangeTypeColors].light,
                                      ChangeTypeColors[type as keyof typeof ChangeTypeColors].dark
                                    )}
                                  >
                                    {type}
                                  </Badge>
                                </h4>
                                <div className="grid gap-4">
                                  {changes.map((change, index) => (
                                    <Card
                                      key={index}
                                      className="overflow-hidden bg-background/40 hover:bg-background/60 transition-colors"
                                    >
                                      <CardContent className="p-4 space-y-4">
                                        <div>
                                          <h5 className="font-medium mb-2">{change.title}</h5>
                                          <p className="text-sm text-muted-foreground">
                                            {change.description}
                                          </p>
                                        </div>

                                        {(change.technical_details || change.affected_areas) && (
                                          <Separator className="my-3" />
                                        )}

                                        {change.technical_details && (
                                          <div className="flex gap-2.5 text-sm">
                                            <Code className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground/70" />
                                            <p className="text-muted-foreground leading-relaxed">
                                              {change.technical_details}
                                            </p>
                                          </div>
                                        )}

                                        {change.affected_areas && (
                                          <div className="flex gap-2.5 text-sm">
                                            <Layout className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground/70" />
                                            <div className="flex flex-wrap gap-1.5">
                                              {change.affected_areas.map((area) => (
                                                <Badge
                                                  key={area}
                                                  variant="outline"
                                                  className={cn(
                                                    'text-xs transition-colors',
                                                    AreaTypeColors[area].light,
                                                    AreaTypeColors[area].dark
                                                  )}
                                                >
                                                  {area}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
