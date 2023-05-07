import type { BskyAgent } from "@atproto/api";
import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import React from "react";
import clsx from "clsx";

interface Props {
  follower: ProfileViewDetailed;
  ratio: number;
  agent: BskyAgent;
}

export default function (props: Props) {
  const { follower, ratio, agent } = props;
  const mutuals = follower.viewer?.following;

  return (
    <div
      className={clsx("flex items-center p-4 gap-4 relative", {
        "bg-red-500": ratio < 1,
        "opacity-70 bg-gray-100": mutuals,
      })}
    >
      <img
        src={follower.avatar}
        className="max-w-[150px] aspect-square rounded-md"
      />
      <div className="flex flex-col">
        <div>
          {follower.displayName} ({follower.did})
        </div>
        <div>followers: {follower.followersCount}</div>
        <div>follows: {follower.followsCount}</div>
        <div>ratio: {ratio}</div>
        <div className="absolute top-0 right-0 p-4">
          {mutuals ? (
            "mutuals"
          ) : (
            <button
              onClick={async (e) => {
                const target = e.currentTarget;
                target.textContent = "Following...";
                target.disabled = true;
                await agent.follow(follower.did);
                target.textContent = "Followed";
              }}
            >
              Follow
            </button>
          )}
        </div>
        <div>{follower.description}</div>
        <div>
          <a href={`https://staging.bsky.app/profile/${follower.handle}`}>
            @{follower.handle}
          </a>
        </div>
      </div>
    </div>
  );
}
