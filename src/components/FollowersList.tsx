import { BskyAgent } from "@atproto/api";
import FollowerCard from "./FollowerCard";
import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import React from "react";
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
  const followers = (
    await AGENT.getFollowers({
      actor: user.did,
    })
  ).data.followers;
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

const AGENT = new BskyAgent({
  service: "https://bsky.social",
});

export default function () {
  const [followers, setFollowers] = React.useState<ProfileViewDetailed[]>([]);

  const fetchData = async () => {
    const user = await resumeSession();
    setFollowers(await getFollowersData(user));
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="mx-6 border rounded-lg overflow-hidden divide-y">
      {followers
        ?.sort((a, b) => ratio(b) - ratio(a))
        .map((f) => (
          <FollowerCard
            key={f.did}
            follower={f}
            ratio={ratio(f)}
            agent={AGENT}
          />
        ))}
    </div>
  );
}
