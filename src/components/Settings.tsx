import type React from "react";

interface Props {
  hideMutuals: boolean;
  setHideMutuals: React.Dispatch<React.SetStateAction<boolean>>;
  algorithm: "ratio" | "following";
  setAlgorithm: React.Dispatch<React.SetStateAction<"ratio" | "following">>;
}

export default function (props: Props) {
  const { hideMutuals, setHideMutuals, algorithm, setAlgorithm } = props;
  return (
    <div className="m-4 p-4 border border-gray-500 rounded-lg flex flex-col gap-2">
      <label>
        <input
          className="mr-2"
          type="checkbox"
          checked={hideMutuals}
          onChange={() => {
            setHideMutuals((hideMutuals) => !hideMutuals);
          }}
        />
        Hide mutuals
      </label>
      <fieldset className="flex flex-col gap">
        <legend>Order by:</legend>
        <label>
          <input
            className="mr-2"
            type="radio"
            name="sorting"
            value="ratio"
            checked={algorithm == "ratio"}
            onChange={() => {
              setAlgorithm("ratio");
            }}
          />
          Followers/following ratio
        </label>
        <label>
          <input
            className="mr-2"
            type="radio"
            name="sorting"
            value="follows"
            checked={algorithm == "following"}
            onChange={() => {
              setAlgorithm("following");
            }}
          />
          Number of follows
        </label>
      </fieldset>
    </div>
  );
}
