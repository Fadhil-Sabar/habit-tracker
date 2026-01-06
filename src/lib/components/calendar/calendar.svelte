<script lang="ts">
	import { addWeeks, subWeeks, startOfWeek, addDays, format, isSameDay } from 'date-fns';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		Dialog,
		DialogClose,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '../ui/dialog';
	import { Input } from '../ui/input';
	import { Textarea } from '../ui/textarea';
	import Button, { buttonVariants } from '../ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { Select, SelectGroup, SelectItem, SelectTrigger } from '../ui/select';
	import SelectContent from '../ui/select/select-content.svelte';
	import { getAllColorPalette } from '$lib/utils';
	import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '../ui/popover';
	import { Calendar } from '../ui/calendar';
	import { CalendarIcon, Pencil, Settings2, Trash } from 'lucide-svelte';
	import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
	import { browser } from '$app/environment';
	import Label from '../ui/label/label.svelte';
	interface Event {
		id: string;
		title: string;
		calendarId: string;
		date: DateValue;
		startHour: number;
		description?: string;
		durationHours: number;
	}

	interface Calendar {
		id: string;
		name: string;
		color: string;
	}

	let allEvents: Event[] = [];

	let calendars: Calendar[] = [
		{
			id: 'c1',
			name: 'Personal',
			color: '#3b82f6'
		}
	];

	let hasInit = false;

	$: {
		if (browser && hasInit) {
			localStorage.setItem('calendars', JSON.stringify(calendars));

			localStorage.setItem('events', JSON.stringify(allEvents));
		}
	}

	let currentDate = new Date();
	const timeSlots = Array.from({ length: 24 }, (_, i) => i);
	let visibleCalendarIds = calendars.map((cal) => cal.id);

	let animationDirection: 'next' | 'prev' = 'next';

	let modal = {
		id: '',
		isOpen: false,
		title: '',
		description: '',
		date: new CalendarDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
		startTime: '09:00',
		endTime: '10:00',
		calendarId: '',
		isEditing: false
	};

	let calendar = {
		open: false,
		id: '',
		name: '',
		color: '#ff0000',
		isEdit: false
	};

	let openDateModal = false;

	$: displayedWeek = (() => {
		const start = startOfWeek(currentDate, { weekStartsOn: 0 });
		return Array.from({ length: 7 }, (_, i) => addDays(start, i));
	})();

	$: displayedMonth = format(currentDate, 'MMMM yyyy');

	$: filteredEvents = allEvents.filter((event) => visibleCalendarIds.includes(event.calendarId));

	onMount(() => {
		const savedEvents = localStorage.getItem('events');
		if (savedEvents) {
			allEvents = JSON.parse(savedEvents);
			allEvents = allEvents.map((event) => ({
				...event,
				date: new CalendarDate(event.date.year, event.date.month, event.date.day)
			}));
			refreshEvents();
		}

		let savedCalendars = localStorage.getItem('calendars');
		if (savedCalendars) {
			calendars = JSON.parse(savedCalendars);
			visibleCalendarIds = calendars.map((cal) => cal.id);
		}
		hasInit = true;
	});

	$: mode = {
		isEdit: !!modal.isEditing,
		isCreate: !!(!modal.isEditing && !modal.id),
		isDetail: !!(!modal.isEditing && modal.id)
	};

	// --- 4. HELPER constS ---

	const getCalendar = (calendarId: string) => {
		return calendars.find((cal) => cal.id === calendarId);
	};

	$: eventsMap = filteredEvents.reduce(
		(acc, event) => {
			const dateKey = event.date.toString();
			if (!acc[dateKey]) acc[dateKey] = [];
			acc[dateKey].push(event);
			return acc;
		},
		{} as Record<string, Event[]>
	);

	const getEventsForDay = (day: Date) => {
		const dateKey = new CalendarDate(
			day.getFullYear(),
			day.getMonth() + 1,
			day.getDate()
		).toString();
		return eventsMap[dateKey] || [];
	};

	const calculatePosition = (event: { startHour: number; durationHours: number }) => {
		const START_HOUR = 0;
		const TOTAL_HOURS = 24;
		const topPercent = ((event.startHour - START_HOUR) / TOTAL_HOURS) * 100;
		const heightPercent = (event.durationHours / TOTAL_HOURS) * 100;
		return `top: ${topPercent}%; height: ${heightPercent}%;`;
	};

	const goToNextWeek = () => {
		animationDirection = 'next'; // Set arah
		currentDate = addWeeks(currentDate, 1);
	};

	const goToPrevWeek = () => {
		animationDirection = 'prev'; // Set arah
		currentDate = subWeeks(currentDate, 1);
	};

	const goToToday = () => {
		const today = new Date();
		if (isSameDay(currentDate, today)) return; // Sudah di hari ini

		const isTodayInCurrentWeek = displayedWeek.some((day) => isSameDay(day, today));

		if (isTodayInCurrentWeek) {
			currentDate = today;
		} else {
			animationDirection = today > currentDate ? 'next' : 'prev';
			currentDate = today;
		}
	};

	const handleClickHour = (hour: number, day: Date) => {
		modal = {
			id: '',
			isOpen: true,
			title: '',
			description: '',
			date: new CalendarDate(day.getFullYear(), day.getMonth() + 1, day.getDate()),
			startTime: `${String(hour).padStart(2, '0')}:00`,
			endTime: `${String(hour + 1).padStart(2, '0')}:00`,

			calendarId: calendars[0]?.id || '',
			isEditing: false
		};
	};

	const handleKeyDownHour = (event: KeyboardEvent, hour: number, day: Date) => {
		// Jika tombol yang ditekan adalah Spasi atau Enter
		if (event.key === ' ' || event.key === 'Enter') {
			// Cegah aksi default (misalnya spasi men-scroll halaman)
			event.preventDefault();
			// Panggil fungsi klik yang sama
			handleClickHour(hour, day);
		}
	};

	const handleDetailHour = (data: any) => {
		modal = {
			id: data.id,
			isOpen: true,
			title: data.title,
			description: data.description,
			date: new CalendarDate(
				new Date(data.date).getFullYear(),
				new Date(data.date).getMonth() + 1,
				new Date(data.date).getDate()
			),
			startTime: `${String(Math.floor(data.startHour)).padStart(2, '0')}:${String(
				(data.startHour % 1) * 60
			).padStart(2, '0')}`,
			endTime: `${String(Math.floor(data.startHour + data.durationHours)).padStart(
				2,
				'0'
			)}:${String(((data.startHour + data.durationHours) % 1) * 60).padStart(2, '0')}`,

			calendarId: data.calendarId,
			isEditing: false
		};
	};

	const handleKeyDownDetailHour = (event: KeyboardEvent, data: any) => {
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			handleDetailHour(data);
		}
	};

	const refreshEvents = () => {
		goToNextWeek();
		goToPrevWeek();
	};

	const resetModal = () => {
		modal = {
			id: '',
			isOpen: false,
			title: '',
			description: '',
			date: new CalendarDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
			startTime: '09:00',
			endTime: '10:00',
			calendarId: '',
			isEditing: false
		};
	};

	const handleAddEvent = () => {
		const newEvent = {
			id: modal.id || `e${allEvents.length + 1}`,
			title: modal.title,
			calendarId: modal.calendarId ?? 'c1', // Default ke kalender Personal
			date: modal.date,
			startHour: parseInt(modal.startTime.split(':')[0], 10),
			description: modal.description,
			durationHours:
				parseInt(modal.endTime.split(':')[0], 10) +
				parseInt(modal.endTime.split(':')[1], 10) / 60 -
				(parseInt(modal.startTime.split(':')[0], 10) +
					parseInt(modal.startTime.split(':')[1], 10) / 60)
		};

		if (modal.id) {
			// Update existing event
			allEvents = allEvents.map((event) =>
				event.id === modal.id ? { ...event, ...newEvent, id: modal.id } : event
			);
		} else {
			// Add new event
			allEvents = [...allEvents, newEvent];
		}

		refreshEvents();

		resetModal();
	};

	const handleOpenCalendar = () => {
		calendar.open = true;
	};

	const handleCloseCalendar = () => {
		calendar = {
			open: false,
			id: '',
			name: '',
			color: '#ff0000',
			isEdit: false
		};
	};

	const handleAddCalendar = () => {
		const id = calendar.id || `c${calendars.length + 1}`;
		let newCalendar = {
			id,
			name: calendar.name,
			color: calendar.color
		};

		if (calendar.id) {
			// Update existing event
			calendars = calendars.map((cal) =>
				cal.id === calendar.id ? { ...cal, ...newCalendar, id: calendar.id } : cal
			);
		} else {
			// Add new event
			calendars = [...calendars, newCalendar];
		}

		visibleCalendarIds = [...visibleCalendarIds, id];

		handleCloseCalendar();
	};

	const handleEditModal = () => {
		modal = {
			...modal,
			isEditing: true
		};
	};

	const handleDeleteEvent = () => {
		allEvents = allEvents.filter((item) => item.id !== modal.id);
		resetModal();
		refreshEvents();
	};

	const handleDetailCalendar = (dataCalendar: (typeof calendars)[0]) => {
		calendar = {
			...calendar,
			...dataCalendar,
			isEdit: false,
			open: true
		};
	};

	const handleEditCalendar = () => {
		calendar.isEdit = true;
	};

	const handleDeleteCalendar = () => {
		allEvents = allEvents.filter((event) => event.calendarId !== calendar.id);
		calendars = calendars.filter((item) => item.id !== calendar.id);
		handleCloseCalendar();
	};
</script>

<div class="grid h-screen md:grid-cols-6">
	<div class="hidden p-4 md:block">
		<h2 class="mb-4 text-xl font-bold">Calendars</h2>
		<div class="space-y-2">
			{#each calendars as calendar}
				<div class="group flex h-8 items-center justify-between">
					<label class="flex cursor-pointer items-center space-x-2">
						<input
							type="checkbox"
							bind:group={visibleCalendarIds}
							value={calendar.id}
							class="form-checkbox rounded"
							style="color: {calendar.color};"
							on:change={refreshEvents}
						/>
						<span class="size-3 rounded-full" style="background-color: {calendar.color};"></span>
						<span>{calendar.name}</span>
					</label>
					<button
						class={buttonVariants({ size: 'sm' }) +
							' hidden! cursor-pointer bg-primary group-hover:block!'}
						on:click={() => handleDetailCalendar(calendar)}
					>
						<Pencil />
					</button>
				</div>
			{/each}

			<div class="flex items-center justify-center">
				<Button variant="outline" class="w-full" onclick={handleOpenCalendar}>Add Calendar</Button>
				<Dialog open={calendar.open}>
					<!-- <DialogTrigger class="w-full">
					</DialogTrigger> -->
					<DialogContent>
						<DialogHeader>
							<div class="flex items-center justify-between">
								<DialogTitle
									>{calendar.isEdit
										? 'Edit Calendar'
										: calendar.id
											? 'Detail Calendar'
											: 'Add New Calendar'}</DialogTitle
								>
								<div class="mr-5 space-x-2 {calendar.id ? 'flex' : 'hidden'}">
									<Button
										class={buttonVariants({ size: 'icon' }) + ' cursor-pointer bg-primary'}
										onclick={() => handleEditCalendar()}
									>
										<Pencil />
									</Button>
									<Dialog>
										<DialogTrigger
											class={buttonVariants({ size: 'icon' }) + ' cursor-pointer bg-destructive'}
										>
											<Trash />
										</DialogTrigger>

										<DialogContent class="max-w-sm">
											<p class="mb-4 text-[1em]">
												Are you sure you want to delete the calendar? <b
													>This will also delete all event that related to this calendar</b
												>
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
													onclick={() => handleDeleteCalendar()}
												>
													Delete
												</Button>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</div>
						</DialogHeader>
						<div class="flex flex-col">
							<div class="flex gap-2" id="calendar-inputs">
								<Input
									placeholder="Calendar Name"
									class="mb-4"
									bind:value={calendar.name}
									disabled={!!(!calendar.isEdit && calendar.id)}
								/>
								<Select
									type="single"
									bind:value={calendar.color}
									disabled={!!(!calendar.isEdit && calendar.id)}
								>
									<SelectTrigger>
										{getAllColorPalette().find((c) => c === calendar.color) || 'Pick Color'}
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{#each getAllColorPalette() as color}
												<SelectItem value={color} style="background-color: {color};"
													>{color}</SelectItem
												>
											{/each}3
										</SelectGroup>
									</SelectContent>
								</Select>
								<Input
									type="color"
									class="mb-4"
									bind:value={calendar.color}
									disabled={!!(!calendar.isEdit && calendar.id)}
								/>
							</div>

							{#if !calendar.id || calendar.isEdit}
								<div class="mt-4 flex justify-end space-x-2">
									<Button variant="secondary" onclick={handleCloseCalendar}>Cancel</Button>
									<Button variant="default" onclick={handleAddCalendar}>
										{calendar.isEdit ? 'Update Calendar' : 'Add New Calendar'}
									</Button>
								</div>
							{/if}
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	</div>

	<div class="flex p-4 md:hidden">
		<Popover>
			<PopoverTrigger class="w-full">
				<Button class="w-full">List Calendar</Button>
			</PopoverTrigger>

			<PopoverContent class="w-full min-w-[400px]" align="center">
				{#each calendars as calendar}
					<div class="group flex h-8 items-center justify-between">
						<label class="flex cursor-pointer items-center space-x-2">
							<input
								type="checkbox"
								bind:group={visibleCalendarIds}
								value={calendar.id}
								class="form-checkbox rounded"
								style="color: {calendar.color};"
								on:change={refreshEvents}
							/>
							<span class="size-3 rounded-full" style="background-color: {calendar.color};"></span>
							<span>{calendar.name}</span>
						</label>
						<PopoverClose>
							<Button size="sm" onclick={() => handleDetailCalendar(calendar)}>
								<Settings2 />
							</Button>
						</PopoverClose>
					</div>
				{/each}
			</PopoverContent>
		</Popover>
	</div>

	<div class="flex min-h-min flex-col border pb-5 md:col-span-5">
		<div class="flex items-center justify-between border-b p-2">
			<Label class="text-[1.5em] font-bold">{displayedMonth}</Label>
			<div class="flex space-x-2">
				<Button onclick={goToPrevWeek} class="py- rounded px-3">&lt;</Button>
				<Button onclick={goToToday} class="py- rounded px-3">Today</Button>
				<Button onclick={goToNextWeek} class="py- rounded px-3">&gt;</Button>
			</div>
		</div>

		<div class="flex border-b">
			<div class="w-16 flex-shrink-0"></div>
			{#each displayedWeek as day}
				<div class="flex-1 p-2 text-center font-medium">
					{format(day, 'E d')}
				</div>
			{/each}
		</div>

		<div class="flex flex-1 pt-3">
			<div class="w-16 flex-shrink-0">
				{#each timeSlots as hour}
					<div class="-mt-2 h-14 pr-2 text-right text-sm text-muted-foreground">
						{#if hour === 0}
							12 AM
						{:else if hour === 12}
							12 PM
						{:else if hour < 12}
							{hour} AM
						{:else if hour === 24}
							12 PM
						{:else}
							{hour - 12} PM
						{/if}
					</div>
				{/each}
			</div>

			<div class="relative flex-1">
				{#key displayedWeek[0]}
					<div
						class="absolute inset-0 grid grid-cols-7"
						in:fly={{
							duration: 250,
							easing: cubicOut,
							x: animationDirection === 'next' ? 300 : -300
						}}
						out:fly={{
							duration: 250,
							easing: cubicOut,
							x: animationDirection === 'next' ? -300 : 300
						}}
					>
						{#each displayedWeek as day}
							<div class="relative border-l border-gray-200">
								{#each timeSlots as hour}
									<div
										tabindex="0"
										role="button"
										on:keydown={(e) => handleKeyDownHour(e, hour, day)}
										on:click={() => handleClickHour(hour, day)}
										class="h-12 border-b border-gray-100 hover:cursor-pointer hover:bg-accent"
										class:border-t={hour === 0}
									></div>
								{/each}

								{#each getEventsForDay(day) as event}
									{@const cal = getCalendar(event.calendarId)}
									<div
										tabindex="0"
										role="button"
										on:keydown={(e) => handleKeyDownDetailHour(e, event)}
										on:click={() => handleDetailHour(event)}
										class="absolute left-1 w-11/12 cursor-pointer rounded p-1 text-sm text-black hover:shadow-lg"
										style="{calculatePosition(
											event
										)} background-color: {cal?.color}B3; border-left: 3px solid {cal?.color};"
									>
										<div class="font-semibold">{event.title}</div>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				{/key}
			</div>
		</div>
	</div>
</div>

<Dialog open={modal.isOpen}>
	<DialogContent>
		<DialogHeader>
			<div class="flex items-center justify-between">
				<DialogTitle
					>{mode.isEdit
						? 'Edit Event'
						: mode.isDetail
							? 'Detail Event'
							: 'Add New Event'}</DialogTitle
				>
				<div class="mr-5 space-x-2 {mode.isDetail ? 'flex' : 'hidden'}">
					<Button
						class={buttonVariants({ size: 'icon' }) + ' cursor-pointer bg-primary'}
						onclick={() => handleEditModal()}
					>
						<Pencil />
					</Button>
					<Dialog>
						<DialogTrigger
							class={buttonVariants({ size: 'icon' }) + ' cursor-pointer bg-destructive'}
						>
							<Trash />
						</DialogTrigger>

						<DialogContent class="max-w-sm">
							<p class="mb-4 text-[1em]">Are you sure you want to delete the event?</p>
							<div class="flex justify-end gap-2">
								<DialogClose
									class={buttonVariants({ variant: 'secondary' }) + ' cursor-pointer text-[1em]'}
								>
									Cancel
								</DialogClose>
								<DialogClose
									class={buttonVariants({ variant: 'destructive' }) + ' cursor-pointer text-[1em]'}
									onclick={() => handleDeleteEvent()}
								>
									Delete
								</DialogClose>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</DialogHeader>

		<div class="flex flex-col" id="modal-inputs">
			<Input
				placeholder="Event Title"
				class="mb-4"
				bind:value={modal.title}
				disabled={mode.isDetail}
			/>
			<Textarea
				placeholder="Event Description"
				class="mb-4"
				bind:value={modal.description}
				disabled={mode.isDetail}
			/>
			<div class="flex flex-col justify-center gap-2">
				<div class="grid grid-cols-2 gap-2">
					<Select type="single" bind:value={modal.calendarId}>
						<SelectTrigger class="w-full" disabled={mode.isDetail}
							>{calendars.find((cal) => cal.id === modal.calendarId)?.name ||
								'Choose Calendar'}</SelectTrigger
						>
						<SelectContent>
							<SelectGroup>
								{#each calendars as cal}
									<SelectItem value={cal.id}>{cal.name}</SelectItem>
								{/each}
							</SelectGroup>
						</SelectContent>
					</Select>

					<Popover bind:open={openDateModal}>
						<PopoverTrigger id="date">
							{#snippet child({ props })}
								<Button
									{...props}
									variant="outline"
									class="w-full justify-between font-normal"
									disabled={mode.isDetail}
								>
									{modal.date
										? modal.date.toDate(getLocalTimeZone()).toLocaleDateString()
										: 'Select date'}
									<CalendarIcon />
								</Button>
							{/snippet}
						</PopoverTrigger>
						<PopoverContent class="w-auto overflow-hidden p-0" align="start">
							<Calendar
								type="single"
								bind:value={modal.date}
								captionLayout="dropdown"
								onValueChange={() => {
									openDateModal = false;
								}}
							/>
						</PopoverContent>
					</Popover>
				</div>

				<div class="flex flex-row items-center justify-between gap-2">
					<Input type="time" bind:value={modal.startTime} disabled={mode.isDetail} />
					<span> - </span>
					<Input type="time" bind:value={modal.endTime} disabled={mode.isDetail} />
				</div>
			</div>
			{#if !mode.isDetail}
				<div class="mt-4 flex justify-end space-x-2">
					<Button variant="secondary" onclick={() => (modal.isOpen = false)}>Cancel</Button>
					<Button variant="default" onclick={handleAddEvent}
						>{modal.isEditing ? 'Update' : 'Add'} Event</Button
					>
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
