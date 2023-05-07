import * as bsky from "@atproto/api";

import type {
  ProfileView,
  ProfileViewDetailed,
} from "@atproto/api/dist/client/types/app/bsky/actor/defs";

import FollowerCard from "./FollowerCard";
import React from "react";
import Settings from "./Settings";
import clsx from "clsx";

const { BskyAgent } = bsky;

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const ratio = (profile: ProfileViewDetailed) => {
  if (!profile.followersCount) {
    return 1000;
  }
  if (!profile.followsCount) {
    return -1000;
  }
  return profile.followersCount / profile.followsCount;
};

const AGENT = new BskyAgent({
  service: "https://bsky.social",
});

const getSession = () => {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("bsky-session"))
    ?.split("=")[1];
};

const resumeSession = async () => {
  const cookieValue = getSession();
  if (!cookieValue) {
    throw new Error("Bluesky session not found");
  }
  return (
    await AGENT.resumeSession(JSON.parse(decodeURIComponent(cookieValue)))
  ).data;
};

const MAX_FOLLOWERS = 100;
const checkMaxFollowers = async (user: { did: string }) => {
  const profile = await AGENT.getProfile({ actor: user.did });
  if (profile.data.followersCount! > MAX_FOLLOWERS) {
    throw new Error(
      "The BlueSky API rate limiter says you have too many followers."
    );
  }
};

const PEOPLE_FOR_ITERATION = 10;
const getFollowersData = async (
  user: { did: string },
  progress: (chunk: number, total: number) => void
) => {
  await checkMaxFollowers(user);
  const followers: ProfileView[] = [];
  const data = (
    await AGENT.getFollowers({
      actor: user.did,
    })
  ).data;
  followers.push(...data.followers);
  let cursor = data.cursor;
  while (cursor) {
    const result = await AGENT.getFollowers({
      actor: user.did,
      cursor,
    });
    if (!result.success) {
      throw new Error("There was an error fetching the user data.");
    }
    result.data.followers.forEach((f) => followers.push(f));
    cursor = result.data.cursor;
  }
  const result: ProfileViewDetailed[] = [];
  const iterations = Math.ceil(followers.length / PEOPLE_FOR_ITERATION);

  for (let i = 0; i < iterations; i++) {
    progress(i + 1, iterations);
    console.log(`iteration ${i}`);
    const requests = followers.slice(
      i * PEOPLE_FOR_ITERATION,
      (i + 1) * PEOPLE_FOR_ITERATION
    );

    const partialResult = await Promise.all(
      requests.map(
        async (f) =>
          await AGENT.getProfile({
            actor: f.did,
          })
      )
    );
    if (partialResult.some((result) => !result.success)) {
      throw new Error("There was an error fetching the user data.");
    }
    partialResult.forEach((r) => result.push(r.data));

    await sleep(200 * PEOPLE_FOR_ITERATION);
  }

  return result;
};

const ratioSort = (a: ProfileViewDetailed, b: ProfileViewDetailed) =>
  ratio(b) - ratio(a);
const followsSort = (a: ProfileViewDetailed, b: ProfileViewDetailed) =>
  a.followsCount! - b.followsCount!;

export default function () {
  const [followers, setFollowers] = React.useState<
    ProfileViewDetailed[] | null
  >(null);
  const [hideMutuals, setHideMutuals] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<false | string>(false);
  const [algorithm, setAlgorithm] = React.useState<"ratio" | "following">(
    "ratio"
  );
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = async () => {
    setLoading("Loading...");
    const user = await resumeSession();
    setFollowers(
      await getFollowersData(user, (current, total) => {
        setLoading(`Loading chunk ${current} of ${total}`);
      })
    );
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData().catch((e) => setError((e as Error).message));
  }, []);

  if (!getSession()) {
    return <></>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (loading) {
    return <div>{loading}</div>;
  }

  return (
    <>
      <Settings
        hideMutuals={hideMutuals}
        setHideMutuals={setHideMutuals}
        algorithm={algorithm}
        setAlgorithm={setAlgorithm}
      />
      {followers && (
        <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-3 mx-6 overflow-hidden divide-y w-100">
          {followers
            .filter((f) => !hideMutuals || !f.viewer?.following)
            .sort(algorithm == "ratio" ? ratioSort : followsSort)
            .map((f) => (
              <FollowerCard
                key={f.did}
                follower={f}
                ratio={ratio(f)}
                agent={AGENT}
              />
            ))}
        </div>
      )}
    </>
  );
}
