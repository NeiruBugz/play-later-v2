import { LinearClient } from "@linear/sdk";

import { env } from "@/env.mjs";

const linearClient = new LinearClient({
  apiKey: env.LINEAR_API_KEY,
});

type RoadmapIssue = {
  id: string;
  state?: string;
  title: string;
};

export const getMyIssues = async () => {
  const roadmap: Array<RoadmapIssue> = [];
  try {
    const issues = await linearClient.issues({
      filter: {
        state: { name: { in: ["Backlog", "In Progress"] } },
      },
    });

    for (const node of issues.nodes) {
      const state = await node?.state;

      if (state?.name) {
        roadmap.push({
          id: node.id,
          state: state.name,
          title: node.title,
        });
      }
    }
  } catch (error) {
    console.error("Error fetching issues:", error);
  }

  return roadmap;
};
