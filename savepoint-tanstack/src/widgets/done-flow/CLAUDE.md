# Widget: done-flow

Opens the Done follow-up when a status change to Done succeeds
(spec 026 §2.7). `DoneFlowProvider` supplies the `DoneHandler` seam of
manage-library-entry and renders `DoneFollowUp`. Mounted once in
`routes/__root.tsx` inside `AddFlowProvider`. Steam import does not go through
`useSetStatus`, so it never opens the follow-up.
