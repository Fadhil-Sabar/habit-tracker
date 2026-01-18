<script lang="ts">
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Popover } from '$lib/components/ui/popover';
	import PopoverContent from '$lib/components/ui/popover/popover-content.svelte';
	import PopoverTrigger from '$lib/components/ui/popover/popover-trigger.svelte';
	import { getDaysInMonth, getWeekDays } from '$lib/utils';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import {
		Clock,
		Download,
		FileUp,
		GripVertical,
		MoonIcon,
		SunIcon,
		Trash,
		Upload
	} from 'lucide-svelte';
	import { Months, type Habit } from '$lib/stores';
	import Table from '$lib/components/ui/table/table.svelte';
	import TableHeader from '$lib/components/ui/table/table-header.svelte';
	import TableRow from '$lib/components/ui/table/table-row.svelte';
	import TableHead from '$lib/components/ui/table/table-head.svelte';
	import TableBody from '$lib/components/ui/table/table-body.svelte';
	import TableCell from '$lib/components/ui/table/table-cell.svelte';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import { v4 as uuidV4 } from 'uuid';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Dialog, DialogClose, DialogContent, DialogTrigger } from '$lib/components/ui/dialog';
	import Calendar from '$lib/components/calendar/calendar.svelte';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { toggleMode } from 'mode-watcher';
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemHeader
	} from '$lib/components/ui/item';

	const months: Months[] = [
		Months.JAN,
		Months.FEB,
		Months.MAR,
		Months.APR,
		Months.MAY,
		Months.JUN,
		Months.JUL,
		Months.AUG,
		Months.SEP,
		Months.OCT,
		Months.NOV,
		Months.DEC
	];

	const today = new Date();
	let currentMonth = months[today.getMonth()];
	const currentYear = today.getFullYear();
	let listDate = getDaysInMonth(months.indexOf(currentMonth) + 1, currentYear);

	let listDay = getWeekDays('en-EN');
	$: startOfWeek = new Date(`${currentYear}-${currentMonth}`).getDay();

	let filterProgress = today.getDate();
	let filterProgressTitle = `${today.toLocaleString('default', { month: 'long' })}`;

	let listHabit: Habit[] = [];
	let hasInit = false;

	let habit = {
		value: ''
	};

	let fileInput: HTMLInputElement;

	const handleCheckHabit = (habitToUpdate: Habit, date: number) => {
		listHabit = listHabit.map((h) => {
			if (h.id === habitToUpdate.id) {
				const monthEntry = h.dates.find((d) => d.month === currentMonth);
				if (monthEntry) {
					if (monthEntry.days.includes(date)) {
						monthEntry.days = monthEntry.days.filter((d) => d !== date);
					} else {
						monthEntry.days.push(date);
					}
				} else {
					h.dates.push({ month: currentMonth, days: [date] });
				}
			}
			return h;
		});
	};

	const handleDndFinalize = (event: CustomEvent) => {
		listHabit = event.detail.items;
	};

	const handleChangeHabit = (e: Event, habitToUpdate: Habit) => {
		const newName = (e.target as HTMLInputElement).value;
		listHabit = listHabit.map((h) => (h.id === habitToUpdate.id ? { ...h, name: newName } : h));
	};

	const handleAddNewHabit = () => {
		listHabit = [
			...listHabit,
			{
				id: uuidV4(),
				name: 'New Habit',
				dates: []
			}
		];
	};

	const handleDeleteHabit = (habitToDelete: Habit) => {
		listHabit = listHabit.filter((h) => h.id !== habitToDelete.id);
	};

	const handleExportBackup = () => {
		try {
			const calendars = JSON.parse(localStorage.getItem('calendars') || '[]');
			const events = JSON.parse(localStorage.getItem('events') || '[]');
			const listHabit = JSON.parse(localStorage.getItem('listHabit') || '[]');

			const backupData = {
				version: 1,
				exportedAt: new Date().toISOString(),
				data: {
					calendars,
					events,
					listHabit
				}
			};

			const dataStr = JSON.stringify(backupData, null, 2);
			const blob = new Blob([dataStr], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			const dateStr = new Date().toISOString().split('T')[0];
			a.download = `backup-habit-tracker-${dateStr}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error(error);
			alert('Failed to export data.');
		}
	};

	const handleImportBackup = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target?.result as string;
				const parsed = JSON.parse(content);

				if (!parsed.data || !parsed.data.listHabit) {
					throw new Error('Format file invalid');
				}

				if (
					confirm(
						`Do you sure want to import data from ${parsed.exportedAt?.split('T')[0]}? Current data will be replaced.`
					)
				) {
					localStorage.setItem('calendars', JSON.stringify(parsed.data.calendars || []));
					localStorage.setItem('events', JSON.stringify(parsed.data.events || []));
					localStorage.setItem('listHabit', JSON.stringify(parsed.data.listHabit || []));

					location.reload();
				}
			} catch (error) {
				console.error(error);
				alert('File backup is not valid or broken.');
			}
		};
		reader.readAsText(file);
		target.value = '';
	};

	onMount(() => {
		const savedHabits = localStorage.getItem('listHabit');
		if (savedHabits) {
			listHabit = JSON.parse(savedHabits);
			habit.value = listHabit[0].id;
		}
		hasInit = true;
	});

	$: {
		listDate = getDaysInMonth(months.indexOf(currentMonth) + 1, currentYear);
		filterProgressTitle = `${new Date(currentYear, months.indexOf(currentMonth)).toLocaleString(
			'default',
			{ month: 'long' }
		)}`;
		if (browser && hasInit) {
			localStorage.setItem('listHabit', JSON.stringify(listHabit));
		}
	}

	$: triggerValue = {
		habit: listHabit.find((item) => item.id === habit.value)
	};

	$: habitDays = triggerValue.habit?.dates.find((item) => item.month === currentMonth)?.days;
</script>

<div class="my-5 text-[16px] md:m-10">
	<div class="mx-5 grid grid-cols-1 justify-between gap-5 md:mx-0 md:grid-cols-3">
		<div class="flex justify-between md:col-span-2">
			<span class="text-[1.75em] font-bold tracking-widest">Habit Tracker</span>
			<div class="flex gap-2">
				<Dialog>
					<DialogTrigger class="self-start">
						<Button>
							<FileUp />
							<span class="hidden md:block">Backup / Export Data</span>
						</Button>
					</DialogTrigger>
					<DialogContent>
						<div class="grid grid-cols-1 gap-4">
							<Item variant="outline">
								<ItemContent>
									<ItemHeader>Backup Data</ItemHeader>
									<ItemDescription
										>Backup your current data. Your data will be saved as backup-habit-tracker-{'<date>'}.json</ItemDescription
									>
								</ItemContent>

								<ItemActions>
									<Button
										size="icon"
										onclick={() => handleExportBackup()}
										placeholder="Export Data"
									>
										<Upload />
									</Button>
								</ItemActions>
							</Item>

							<input
								type="file"
								accept=".json"
								class="hidden"
								bind:this={fileInput}
								on:change={handleImportBackup}
							/>

							<Item variant="outline">
								<ItemContent>
									<ItemHeader>Import Data</ItemHeader>
									<ItemDescription
										>Import from your exported data.
										<br />
										The file should be exported from this page.
									</ItemDescription>
								</ItemContent>

								<ItemActions>
									<Button size="icon" onclick={() => fileInput.click()} placeholder="Import Data">
										<Download />
									</Button>

									{#if fileInput?.name}
										<Item variant="outline">
											<ItemContent>
												<ItemDescription>{fileInput.name}</ItemDescription>
											</ItemContent>
										</Item>
									{/if}
								</ItemActions>
							</Item>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>

		<div class="flex flex-col rounded ring-2 ring-secondary md:row-span-2 md:min-w-auto">
			<span class="bg-secondary py-1 text-center text-[1.25em] font-bold">Month</span>
			<ButtonGroup class="grid w-full grid-cols-3" orientation="vertical">
				{#each months as month, i}
					<Button
						class="rounded-none 
                {i === 0 ? 'rounded-tl' : ''} 
                {i === 2 ? 'rounded-tr' : ''}
                {i === 9 ? 'rounded-bl' : ''}
                {i === 11 ? 'rounded-br' : ''}"
						variant={currentMonth === month ? 'default' : 'outline'}
						onclick={() => {
							currentMonth = month;
						}}>{month}</Button
					>
				{/each}
			</ButtonGroup>
		</div>

		<div class="w-full translate-y-4 border md:hidden"></div>

		<Popover>
			<PopoverTrigger
				class={buttonVariants({ variant: 'default' }) +
					' translate-y-5 text-[1em] md:mt-auto md:translate-0'}>List Habit</PopoverTrigger
			>
			<PopoverContent class="w-full max-w-[95dvw]" align="center">
				<div
					class="flex flex-col gap-2 overflow-hidden"
					use:dndzone={{ items: listHabit, flipDurationMs: 300 }}
					on:finalize={handleDndFinalize}
					on:consider={handleDndFinalize}
				>
					{#each listHabit as habit (habit.id)}
						<div animate:flip={{ duration: 300 }} class="flex items-center gap-2">
							<div class="cursor-grab rounded p-1 hover:bg-secondary">
								<GripVertical class="h-5 w-5 text-muted-foreground" />
							</div>
							<Input
								id="width"
								value={habit.name}
								class="col-span-2 h-8 md:text-[1em]"
								onchange={(e) => handleChangeHabit(e, habit)}
							/>

							<div class="flex items-center gap-2 pl-2">
								<Popover>
									<PopoverTrigger
										class={buttonVariants({ size: 'icon' }) + ' cursor-pointer bg-primary'}
									>
										<Clock />
									</PopoverTrigger>
									<PopoverContent align="start">
										<div class="flex flex-row items-center justify-between gap-2">
											<Input type="time" bind:value={habit.startTime} />
											<span> - </span>
											<Input type="time" bind:value={habit.endTime} />
										</div>
									</PopoverContent>
								</Popover>
							</div>

							<Dialog>
								<DialogTrigger
									class={buttonVariants({ size: 'icon' }) + ' cursor-pointer bg-destructive'}
								>
									<Trash />
								</DialogTrigger>

								<DialogContent class="max-w-sm">
									<p class="mb-4 text-[1em]">
										Are you sure you want to delete the habit "<strong>{habit.name}</strong>"?
									</p>
									<div class="flex justify-end gap-2">
										<DialogClose
											class={buttonVariants({ variant: 'secondary' }) +
												' cursor-pointer text-[1em]'}
										>
											Cancel
										</DialogClose>
										<Button
											class={buttonVariants({ variant: 'destructive' }) +
												' cursor-pointer text-[1em]'}
											onclick={() => handleDeleteHabit(habit)}
										>
											Delete
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						</div>
					{/each}

					<div class="flex items-center justify-center">
						<button
							class={buttonVariants({ variant: 'outline' }) +
								' w-full text-[1em] hover:bg-primary-foreground'}
							on:click={() => handleAddNewHabit()}
						>
							Add Habit
						</button>
					</div>
				</div></PopoverContent
			>
		</Popover>
	</div>

	<div class="mx-5 mt-10 hidden md:block">
		<Table class="border-2 border-r-0 text-[1em]">
			<TableHeader>
				<TableRow>
					<TableHead class="max-w-min min-w-[200px] border-r-2 text-left font-bold">Habit</TableHead
					>
					<TableHead class="max-w-min min-w-[150px] border-r-2 text-left font-bold">Time</TableHead>
					<TableHead class="max-w-min min-w-[300px] border-r-2 text-left font-bold"
						>Monthly Progress ({filterProgressTitle})</TableHead
					>
					{#each listDate as date}
						<TableHead
							class="min-w-12 border-r-2 text-center font-semibold transition-colors hover:cursor-pointer hover:bg-primary/30!"
							>{date}</TableHead
						>
					{/each}
				</TableRow>
			</TableHeader>

			<TableBody>
				{#each listHabit as habit (habit.id)}
					<TableRow class="group">
						<TableCell
							class="sticky left-0 z-10 border-r-2 bg-background group-hover:!bg-background"
							>{habit.name}</TableCell
						>
						<TableCell class="border-r-2 bg-background group-hover:!bg-background"
							>{habit.startTime}{habit.endTime ? ' - ' + habit.endTime : ''}</TableCell
						>
						<TableCell class="flex items-center justify-between gap-2 border-r-2 bg-background">
							<span
								>{Math.round(
									((habit.dates.find((d) => d.month === currentMonth)?.days ?? []).length /
										listDate.length) *
										100
								)}%</span
							>
							<Progress
								value={((habit.dates.find((d) => d.month === currentMonth)?.days ?? []).length /
									listDate.length) *
									100}
								max={100}
							/>
						</TableCell>
						{#each listDate as date}
							<TableCell align="center" class="border-r-2 p-0">
								<Checkbox
									class="h-5 w-5 hover:cursor-pointer"
									checked={habit.dates.find((d) => d.month === currentMonth)?.days.includes(date)}
									onclick={() => handleCheckHabit(habit, date)}
								/>
							</TableCell>
						{/each}
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>

	<!-- * Date mobile -->
	<div class="mx-5 mt-10 flex flex-col gap-5 md:hidden">
		<Select type="single" bind:value={habit.value}>
			<div class="flex gap-4">
				<SelectTrigger class="w-full">{triggerValue.habit?.name ?? 'Select Habit'}</SelectTrigger>
				<Button variant="outline" class="min-w-3/12"
					>{triggerValue.habit?.startTime} - {triggerValue.habit?.endTime}</Button
				>
			</div>
			<SelectContent>
				<SelectGroup>
					{#each listHabit as habit (habit.id)}
						<SelectItem value={habit.id}>{habit.name}</SelectItem>
					{/each}
				</SelectGroup>
			</SelectContent>
		</Select>

		<div class="flex w-full items-center gap-4">
			<Progress value={((habitDays ?? []).length / listDate.length) * 100} max={100} />
			<Label class="min-w-1/12"
				>{Math.round(((habitDays ?? []).length / listDate.length) * 100)}%</Label
			>
		</div>

		<div class="grid grid-cols-7 gap-2 divide-x">
			{#each listDay as day}
				<Label class="w-full justify-center p-2">{day}</Label>
			{/each}
		</div>

		<div class="grid grid-cols-7 gap-2">
			{#each listDate as date, i}
				<Button
					variant={habitDays?.includes(date) ? 'default' : 'outline'}
					size="lg"
					onclick={() => habit.value && handleCheckHabit(triggerValue.habit || listHabit[0], date)}
					disabled={!habit.value}
					style={i === 0 ? `grid-column-start: ${startOfWeek === 0 ? 7 : startOfWeek};` : ''}
				>
					{date}
				</Button>
			{/each}
		</div>
	</div>

	<div class="my-10">
		<Calendar />
	</div>

	<div class="fixed right-0 bottom-0 m-5">
		<Button onclick={toggleMode} variant="default" size="icon">
			<SunIcon class="scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90" />
			<MoonIcon class="absolute scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0" />
			<span class="sr-only">Toggle theme</span>
		</Button>
	</div>
</div>
