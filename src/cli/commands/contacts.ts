import type { Command } from 'commander';
import * as p from '@clack/prompts';

interface Contact {
  maw?: string;
  thread?: string;
  inbox?: string;
  notes?: string;
}

interface ContactsFile {
  contacts: Record<string, Contact>;
  updated: string;
}

async function getContactsPath(): Promise<string> {
  const { join } = await import('path');
  const { existsSync } = await import('fs');
  const psiPath = join(process.cwd(), 'ψ', 'contacts.json');
  if (existsSync(join(process.cwd(), 'ψ'))) return psiPath;
  const oraclePath = join(process.cwd(), '.oracle', 'contacts.json');
  return oraclePath;
}

async function loadContacts(): Promise<{ data: ContactsFile; path: string }> {
  const { existsSync } = await import('fs');
  const path = await getContactsPath();
  if (!existsSync(path)) return { data: { contacts: {}, updated: '' }, path };
  try {
    return { data: JSON.parse(await Bun.file(path).text()), path };
  } catch {
    return { data: { contacts: {}, updated: '' }, path };
  }
}

async function saveContacts(data: ContactsFile, path: string): Promise<void> {
  const { dirname } = await import('path');
  const { existsSync, mkdirSync } = await import('fs');
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  data.updated = new Date().toISOString();
  await Bun.write(path, JSON.stringify(data, null, 2) + '\n');
}

export function registerContacts(program: Command) {
  program
    .command('contacts [action] [name]')
    .description('Manage Oracle contacts — add, list, remove')
    .option('--maw <name>', 'maw session name')
    .option('--inbox <path>', 'inbox path')
    .option('--thread <channel>', 'thread channel')
    .action(async (action?: string, name?: string, options?: { maw?: string; inbox?: string; thread?: string }) => {
      const { data, path } = await loadContacts();
      const names = Object.keys(data.contacts);

      // List (default)
      if (!action || action === 'list' || action === 'ls') {
        if (names.length === 0) {
          console.log('\n  📇 No contacts yet.\n');
          console.log('    oracle-skills contacts add <name>\n');
          return;
        }

        console.log(`\n  📇 Contacts (${names.length})`);
        console.log(`  📂 ${path}\n`);
        console.log(`  ${'#'.padStart(3)}  ${'Name'.padEnd(16)} ${'maw'.padEnd(18)} ${'thread'.padEnd(20)} inbox`);
        console.log(`  ${'─'.repeat(3)}  ${'─'.repeat(16)} ${'─'.repeat(18)} ${'─'.repeat(20)} ${'─'.repeat(5)}`);

        names.forEach((n, i) => {
          const c = data.contacts[n];
          console.log(`  ${String(i + 1).padStart(3)}  ${n.padEnd(16)} ${(c.maw || '—').padEnd(18)} ${(c.thread || '—').padEnd(20)} ${c.inbox ? '✓' : '✗'}`);
        });
        console.log('');
        return;
      }

      // Add
      if (action === 'add' || action === 'register') {
        if (!name) {
          const input = await p.text({ message: 'Contact name:', placeholder: 'peter' });
          if (p.isCancel(input)) return;
          name = input as string;
        }

        let maw = options?.maw;
        let thread = options?.thread;
        let inbox = options?.inbox;

        if (!maw) {
          const input = await p.text({
            message: `maw name? (for maw hey <name>)`,
            placeholder: `${name}-oracle`,
            initialValue: `${name}-oracle`,
          });
          if (!p.isCancel(input)) maw = (input as string) || undefined;
        }

        if (!thread) {
          const input = await p.text({
            message: `Thread channel?`,
            placeholder: `channel:${name}`,
            initialValue: `channel:${name}`,
          });
          if (!p.isCancel(input)) thread = (input as string) || undefined;
        }

        if (!inbox) {
          const input = await p.text({
            message: `Inbox path? (Enter to skip)`,
            placeholder: `/path/to/ψ/inbox`,
          });
          if (!p.isCancel(input) && input) inbox = input as string;
        }

        const notes = await p.text({
          message: 'Notes? (optional)',
          placeholder: 'e.g., Frontend dev, Thai timezone',
        });

        data.contacts[name] = {
          ...(maw ? { maw } : {}),
          ...(thread ? { thread } : {}),
          ...(inbox ? { inbox } : {}),
          ...(!p.isCancel(notes) && notes ? { notes: notes as string } : {}),
        };

        await saveContacts(data, path);
        p.log.success(`Added: ${name}`);

        // Show what was saved
        const c = data.contacts[name];
        console.log(`    maw:    ${c.maw || '—'}`);
        console.log(`    thread: ${c.thread || '—'}`);
        console.log(`    inbox:  ${c.inbox || '—'}`);
        if (c.notes) console.log(`    notes:  ${c.notes}`);
        console.log('');
        return;
      }

      // Remove
      if (action === 'remove' || action === 'rm' || action === 'delete') {
        if (!name) {
          if (names.length === 0) { console.log('\n  No contacts.\n'); return; }
          names.forEach((n, i) => console.log(`  ${i + 1}. ${n}`));
          const input = await p.text({ message: 'Enter name or number:' });
          if (p.isCancel(input)) return;
          const val = input as string;
          name = !isNaN(Number(val)) ? names[Number(val) - 1] : val;
        }

        if (!data.contacts[name!]) {
          p.log.error(`Contact not found: ${name}`);
          return;
        }

        const confirmed = await p.confirm({ message: `Remove ${name}?` });
        if (p.isCancel(confirmed) || !confirmed) return;

        delete data.contacts[name!];
        await saveContacts(data, path);
        p.log.success(`Removed: ${name}`);
        return;
      }

      // Show
      if (action === 'show' || action === 'info') {
        if (!name) { p.log.error('Usage: contacts show <name>'); return; }
        const c = data.contacts[name];
        if (!c) { p.log.error(`Contact not found: ${name}`); return; }

        console.log(`\n  📇 ${name}\n`);
        console.log(`    maw:    ${c.maw || '—'}`);
        console.log(`    thread: ${c.thread || '—'}`);
        console.log(`    inbox:  ${c.inbox || '—'}`);
        if (c.notes) console.log(`    notes:  ${c.notes}`);
        console.log('');
        return;
      }

      // If action looks like a name, show it
      if (data.contacts[action]) {
        const c = data.contacts[action];
        console.log(`\n  📇 ${action}\n`);
        console.log(`    maw:    ${c.maw || '—'}`);
        console.log(`    thread: ${c.thread || '—'}`);
        console.log(`    inbox:  ${c.inbox || '—'}`);
        if (c.notes) console.log(`    notes:  ${c.notes}`);
        console.log('');
        return;
      }

      console.log(`\n  Unknown: ${action}`);
      console.log('  Usage: contacts [list|add|remove|show] [name]\n');
    });
}
