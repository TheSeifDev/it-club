/**
 * Board line-ups from the original club roster (legacy `public/COMMITTEES`
 * cutouts, re-encoded to /media/people). Keyed by board code in lowercase.
 *
 * - Head of PR is intentionally absent (role removed).
 * - R&D is not part of the community boards.
 * - Benjamin's legacy record reads "Supervisor of SM", so he stands with SM.
 *
 * Order inside a board = rank order (heads first). CMS member records, when
 * published, still drive the member directory; this file only feeds the
 * board photographs and the club leadership line-up.
 */
export type RosterPerson = {
  id: string;
  name: string;
  role: string;
  src: string;
  width: number;
  height: number;
};

const person = (id: string, name: string, role: string, width: number, height: number): RosterPerson => ({
  id, name, role, src: `/media/people/${id}.webp`, width, height,
});

export const BOARD_ROSTER: Record<string, RosterPerson[]> = {
  club: [
    person("ahmed-samir", "Ahmed Samir", "Head", 710, 900),
    person("adham-ahmed", "Adham Ahmed", "Head", 756, 900),
    person("ahmed-mohsen", "Ahmed Mohsen", "Vice head", 690, 900),
    person("fares", "Fares", "Vice head", 703, 900),
  ],
  it: [
    person("mohamed-ibrahim", "Mohamed Ibrahim", "Supervisor", 751, 900),
    person("seif-ayman", "Seif Ayman", "Vice head", 816, 900),
    person("ziad-ayman", "Ziad Ayman", "Leader", 787, 900),
  ],
  hr: [
    person("marwan-awad", "Marwan Awad", "Head", 984, 900),
    person("islam-el-sayed", "Islam El-Sayed", "Vice head", 823, 900),
  ],
  pr: [],
  sm: [
    person("abdulrahman-ashraf", "Abdulrahman Ashraf", "Head", 707, 900),
    person("mohamed-al-amir", "Mohamed Al-Amir", "Vice head", 465, 900),
    person("merna", "Merna", "Vice head", 761, 900),
    person("benjamin", "Benjamin", "Supervisor", 649, 900),
    person("nour", "Nour", "Leader", 855, 900),
    person("menna", "Menna", "Leader", 359, 427),
    person("youssef-soliman", "Youssef Soliman", "Leader", 650, 900),
  ],
  oc: [
    person("habiba-mounir", "Habiba Mounir", "Head", 620, 900),
    person("mahmoud-sameh", "Mahmoud Sameh", "Vice head", 656, 900),
    person("farida-mohamed", "Farida Mohamed", "Supervisor", 738, 900),
    person("shahd-ahssen", "Shahd Ahssen", "Supervisor", 741, 900),
    person("habiba-ahmed", "Habiba Ahmed", "Supervisor", 776, 900),
    person("mohamed-nagi", "Mohamed Nagi", "Supervisor", 734, 900),
    person("saber", "Saber", "Supervisor", 767, 900),
    person("saif-kambo", "Saif Kambo", "Main board", 741, 900),
    person("mohamed-sherif", "Mohamed Sherif", "Main board", 685, 900),
    person("sherif-hamdy", "Sherif Hamdy", "Main board", 781, 900),
  ],
};

export function boardRoster(code: string): RosterPerson[] {
  return BOARD_ROSTER[code.trim().toLowerCase()] ?? [];
}
