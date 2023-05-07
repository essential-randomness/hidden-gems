import type {
  ProfileView,
  ProfileViewDetailed,
} from "@atproto/api/dist/client/types/app/bsky/actor/defs";

import { BskyAgent } from "@atproto/api";
import FollowerCard from "./FollowerCard";
import React from "react";
import Settings from "./Settings";
import clsx from "clsx";

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

const resumeSession = async () => {
  const cookieValue = document.cookie
    .split("; ")
    .find((row) => row.startsWith("bsky-session"))
    ?.split("=")[1];
  if (!cookieValue) {
    throw new Error("Bluesky session not found");
  }
  return (
    await AGENT.resumeSession(JSON.parse(decodeURIComponent(cookieValue)))
  ).data;
};

const getFollowersData = async (user: { did: string }) => {
  const followers: ProfileView[] = [];
  const data = (
    await AGENT.getFollowers({
      actor: user.did,
    })
  ).data;
  followers.push(...data.followers);
  let cursor = data.cursor;
  while (cursor) {
    const data = (
      await AGENT.getFollowers({
        actor: user.did,
        cursor,
      })
    ).data;
    followers.push(...data.followers);
    cursor = data.cursor;
  }
  return await Promise.all(
    followers.map(
      async (f) =>
        (
          await AGENT.getProfile({
            actor: f.did,
          })
        ).data
    )
  );
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
  const [loading, setLoading] = React.useState<boolean>(false);
  const [algorithm, setAlgorithm] = React.useState<"ratio" | "following">(
    "ratio"
  );

  const fetchData = async () => {
    setLoading(true);
    const user = await resumeSession();
    setFollowers(await getFollowersData(user));
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (!followers) {
    return <></>;
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
