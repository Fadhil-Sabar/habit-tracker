<script lang="ts">
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Popover } from '$lib/components/ui/popover';
	import PopoverContent from '$lib/components/ui/popover/popover-content.svelte';
	import PopoverTrigger from '$lib/components/ui/popover/popover-trigger.svelte';
	import ToggleGroupItem from '$lib/components/ui/toggle-group/toggle-group-item.svelte';
	import ToggleGroup from '$lib/components/ui/toggle-group/toggle-group.svelte';
	import { getDaysInMonth } from '$lib/utils';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { Clock, GripVertical, Moon, Trash } from 'lucide-svelte';
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

	let filterProgress = today.getDate();
	let filterProgressTitle = `${today.toLocaleString('default', { month: 'long' })}`;

	let listHabit: Habit[] = [];
	let hasInit = false;

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
		console.log(event.detail.items);
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

	onMount(() => {
		const savedHabits = localStorage.getItem('listHabit');
		if (savedHabits) {
			listHabit = JSON.parse(savedHabits);
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
</script>

<div class="my-5 text-[16px] md:m-10">
	<div class="mx-5 flex flex-row justify-between md:mx-0">
		<div class="flex flex-col items-start justify-between">
			<span class="text-[1.75em] font-bold tracking-widest">Habit Tracker</span>
			<Popover>
				<PopoverTrigger class={buttonVariants({ variant: 'default' }) + ' text-[1em]'}
					>List Habit</PopoverTrigger
				>
				<PopoverContent class="min-w-[400px]" align="start">
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

		<div class="flex flex-col rounded ring-2 ring-primary-foreground">
			<span class="bg-primary-foreground py-1 text-center text-[1.25em] font-bold">Month</span>
			<ToggleGroup type="multiple">
				<ToggleGroup
					type="single"
					bind:value={currentMonth}
					variant="outline"
					class="grid grid-cols-3 md:grid-cols-6"
				>
					{#each months as month}
						<ToggleGroupItem
							class={`transition-colors ${currentMonth === month && 'bg-primary! text-white!'} h-12 w-14 cursor-pointer text-[1em] font-medium`}
							value={month}
							aria-label={`Select ${month}`}
						>
							{month}
						</ToggleGroupItem>
					{/each}
				</ToggleGroup>
			</ToggleGroup>
		</div>
	</div>

	<div class="mx-5 mt-10">
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
							class="min-w-12 border-r-2 bg-primary-foreground text-center font-semibold transition-colors hover:cursor-pointer hover:bg-primary/30!"
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

	<div class="my-10">
		<Calendar />
	</div>

	<div class="fixed right-0 bottom-0 m-5">
		<Button size="icon" class="hover:cursor-pointer hover:bg-primary/80">
			<Moon />
		</Button>
	</div>
</div>
