import Image from "next/image"
import { BoardMemberType } from "../data/boardmembers"
import { useTranslation } from "next-i18next"

const BoardMember = (props: BoardMemberType) => {
  const { t } = useTranslation("common", { keyPrefix: "boardMember" })

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mx-auto h-[150px] w-[150px] shrink-0 overflow-hidden rounded-full">
        <Image
          src={`/img/styret/${props.img}`}
          fill
          className="object-cover"
          alt={props.name}
          sizes="150px"
        />
      </div>
      <h4 className="mt-3 font-semibold">{props.name}</h4>
      <p className="text-muted text-sm">{props.title ? t(props.title) : ""}</p>
    </div>
  )
}

type Props = {
  boardMembers: BoardMemberType[];
};

const BoardMembers = (props: Props) => {
  const { t } = useTranslation("common", { keyPrefix: "main" });

  return (
    <div className="mx-auto max-w-content px-4">
      <div className="text-center">
        <h1 className="text-[40px] mt-0 mb-4">{t("theBoard")}</h1>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-8">
        {props.boardMembers.map((boardMember) => (
          <div
            key={boardMember.name}
            className="flex min-w-[45%] flex-1 basis-0 flex-col items-center justify-start sm:min-w-[30%] md:min-w-[22%]"
          >
            <BoardMember {...boardMember} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardMembers;
