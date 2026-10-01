export type MenuItem = {
  id: number;
  hierar: string;
  text: string;
  desc?: string | null;
  func: string | null;
  allowed: boolean;
};

export type MenuNode = MenuItem & { children: MenuNode[] };

export function buildMenuTree(items: MenuItem[]): MenuNode[] {
  const sorted = [...items].sort((a, b) =>
    a.hierar.localeCompare(b.hierar, undefined, { numeric: true })
  );

  const map = new Map<string, MenuNode>();
  for (const it of sorted) map.set(it.hierar, { ...it, children: [] });

  const roots: MenuNode[] = [];
  for (const node of map.values()) {
    const i = node.hierar.lastIndexOf(".");
    const parent = i > 0 ? map.get(node.hierar.slice(0, i)) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  return roots;
}